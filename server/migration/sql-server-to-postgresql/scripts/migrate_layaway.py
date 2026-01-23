import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    if value is None: return None
    s = str(value).strip()
    return s if s else None

def safe_int(value):
    if value is None: return None
    try:
        return int(value)
    except:
        return None

def safe_float(value):
    if value is None: return 0.0
    try:
        return float(value)
    except:
        return 0.0

def safe_bool(value):
    if value is None: return False
    if isinstance(value, bool): return value
    if str(value) == '1': return True
    return False

def migrate_layaway():
    print("🚀 Starting Layaway Migration (Flat Table Approach)...")
    
    # Load FK Maps
    try:
        with open('customer_map.json', 'r') as f:
            customer_map = json.load(f)
    except:
        print("⚠ customer_map.json not found. FKs will be skipped.")
        customer_map = {}

    try:
        with open('user_map.json', 'r') as f:
            user_map = json.load(f)
    except:
        print("⚠ user_map.json not found. FKs will skipped.")
        user_map = {}

    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # 1. Transaction Type
        pg_cursor.execute("SELECT id, name FROM store_transaction_type")
        types_map = {str(row[1]).upper(): str(row[0]) for row in pg_cursor.fetchall()}
        
        # User specified 'SL' is 'LAYAWAY DEPOSIT' / Link to agreement
        LAYAWAY_TYPE_ID = types_map.get('SL')
        
        if not LAYAWAY_TYPE_ID:
             # Try alternatives if 'SL' missing
             LAYAWAY_TYPE_ID = types_map.get('LAYAWAY DEPOSIT') or types_map.get('LAYAWAY')

        if not LAYAWAY_TYPE_ID:
             print("⚠ 'SL' (Layaway Deposit) type not found. Attempting to create...")
             try:
                # Inserting 'SL' as per user description
                pg_cursor.execute("INSERT INTO store_transaction_type (name) VALUES ('SL') RETURNING id")
                LAYAWAY_TYPE_ID = str(pg_cursor.fetchone()[0])
                pg_conn.commit()
                print(f"✅ Created 'SL' type: {LAYAWAY_TYPE_ID}")
             except Exception as e:
                print(f"❌ Failed to create SL type: {e}")
                raise e

        # 1.5 Ensure Target Table Exists with Correct Schema
        print("🛠 Checking/Creating 'layaway_agreement' table schema...")
        pg_cursor.execute("DROP TABLE IF EXISTS layaway_agreement CASCADE")
        pg_cursor.execute("""
            CREATE TABLE layaway_agreement (
                id UUID PRIMARY KEY,
                ticketnum TEXT,
                clerk_user_id UUID,
                date_in TIMESTAMP WITH TIME ZONE,
                last_updated_at TIMESTAMP WITH TIME ZONE,
                amount DECIMAL(12, 2),
                tax_sales DECIMAL(12, 2),
                state_tax DECIMAL(12, 2),
                returned_amt DECIMAL(12, 2),
                customer_id UUID,
                note TEXT,
                status TEXT,
                default_date TIMESTAMP WITH TIME ZONE,
                total_of_payments DECIMAL(12, 2),
                period INTEGER,
                extra_note TEXT,
                gun_proc_fee DECIMAL(12, 2),
                last_updated_user_id UUID,
                inventory_number TEXT,
                number_sold INTEGER,
                item_amount DECIMAL(12, 2),
                description TEXT,
                tax_exempt BOOLEAN,
                return_sold BOOLEAN,
                item_status TEXT,
                county_tax_exempt BOOLEAN,
                item_last_updated_user_id UUID,
                items_id TEXT
            )
        """)
        pg_conn.commit()
        print("✅ Re-created 'layaway_agreement' table with requested columns.")

        # 2. Fetch Source Data
        print("Fetching Joined Layaway Data (sold + sitems)...")
        query = """
            SELECT 
                s.Sold_pk, s.TICKETNUM, s.USR_fk, s.CUS_FK,
                s.DATEin, s.PrevDate, s.DATEout,
                s.SaleAmt, s.Taxable, s.TAX, s.ReturnedAmt, s.DEPOSIT,
                s.COMMENT, s.NOTE, s.STATUS, s.PERIOD, s.GunProcFee, s.LastUpdatedUSR_ID,
                s.sld_Message, s.Reminder, s.CountyTaxable,
                
                i.INVNUM, i.NUMBERSOLD, i.AMOUNT as ItemAmt, i.DESCRIPT, 
                i.TAXEXEMPT, i.RETURNSOLD, i.Status as ItemStatus, 
                i.CountyTaxExempt, i.LastUpdatedUSR_ID as ItemLastUser, i.items_pk
            FROM sold s
            LEFT JOIN sitems i ON s.TICKETNUM = i.TICKETNUM
            WHERE s.TRANS = 'L'
        """
        mssql_cursor.execute(query)
        rows = mssql_cursor.fetchall()
        print(f"Found {len(rows)} layaway rows.")

        batch_tx = []
        batch_agreements = []
        ticket_tx_map = {}
        processed_tx_ids = set()
        
        batch_size = 1000
        
        for row in tqdm(rows):
             ticket_num = safe_str(row.get('TICKETNUM'))
             if not ticket_num: continue
             
             # --- Store Transaction (Header) ---
             if ticket_num in ticket_tx_map:
                 tx_id = ticket_tx_map[ticket_num]
             else:
                 tx_id = str(uuid.uuid4())
                 ticket_tx_map[ticket_num] = tx_id
                 
                 # Only add to batch if we haven't processed this valid transaction before in this run
                 # (Just to be safe, though the map handles it logic-wise for the loop)
                 processed_tx_ids.add(tx_id)
                 
                 cust_id = customer_map.get(safe_str(row.get('CUS_FK')))
                 clerk_id = user_map.get(safe_str(row.get('USR_fk')))
                 occurred_at = row.get('DATEin')
                 updated_at = row.get('PrevDate') or occurred_at
                 
                 batch_tx.append((
                    tx_id,
                    ticket_num,
                    cust_id,
                    clerk_id,
                    LAYAWAY_TYPE_ID,
                    occurred_at,
                    safe_float(row.get('SaleAmt')),
                    safe_float(row.get('Taxable')),
                    False,
                    safe_float(row.get('TAX')),
                    0,
                    safe_float(row.get('GunProcFee')),
                    safe_str(row.get('COMMENT')) or safe_str(row.get('NOTE')),
                    occurred_at,
                    updated_at,
                    safe_str(row.get('Sold_pk'))
                 ))

             # --- Layaway Agreement (Flat Row) ---
             st = safe_str(row.get('STATUS'))
             status = 'active' # Default for 'L', 'O', 'MP'
             
             # User specified mapping logic:
             # 'D' -> defaulted (SLD)
             # 'L' -> active (SL)
             # 'S' -> completed (SLU/SLP)
             # 'V' -> voided (SLV)
             
             if st == 'D': status = 'defaulted'
             elif st == 'S': status = 'completed'
             elif st == 'V': status = 'voided'
             elif st == 'C': status = 'completed' # C also commonly used for closed
             
             agreement_id = str(uuid.uuid4())
             
             batch_agreements.append((
                 agreement_id,
                 
                 ticket_num,                      # ticketnum
                 user_map.get(safe_str(row.get('USR_fk'))), # clerk_user_id
                 row.get('DATEin'),               # date_in
                 row.get('PrevDate') or row.get('DATEin'), # last_updated_at
                 safe_float(row.get('SaleAmt')),  # amount
                 safe_float(row.get('Taxable')),  # tax_sales
                 safe_float(row.get('TAX')),      # state_tax
                 safe_float(row.get('ReturnedAmt')), # returned_amt
                 customer_map.get(safe_str(row.get('CUS_FK'))), # customer_id
                 safe_str(row.get('COMMENT')),    # note
                 status,                          # status
                 row.get('DATEout'),              # default_date
                 safe_float(row.get('DEPOSIT')),  # total_of_payments (mapped from DEPOSIT)
                 safe_float(row.get('PERIOD')),   # period
                 safe_str(row.get('NOTE')),       # extra_note
                 safe_float(row.get('GunProcFee')), # gun_proc_fee
                 user_map.get(safe_str(row.get('LastUpdatedUSR_ID'))), # last_updated_user_id
                 
                 safe_str(row.get('INVNUM')),     # inventory_number
                 safe_float(row.get('NUMBERSOLD') or 1), # number_sold
                 safe_float(row.get('ItemAmt')),  # item_amount
                 safe_str(row.get('DESCRIPT')),   # description
                 safe_bool(row.get('TAXEXEMPT')), # tax_exempt
                 safe_bool(row.get('RETURNSOLD')), # return_sold
                 safe_str(row.get('ItemStatus')), # item_status
                 safe_bool(row.get('CountyTaxExempt')), # county_tax_exempt
                 user_map.get(safe_str(row.get('ItemLastUser'))), # item_last_updated_user_id
                 safe_str(row.get('items_pk'))    # items_id
             ))
             
             if len(batch_tx) >= batch_size:
                 _flush_batch(pg_cursor, batch_tx, batch_agreements)
                 pg_conn.commit()
                 batch_tx, batch_agreements = [], []

        if batch_tx or batch_agreements:
            _flush_batch(pg_cursor, batch_tx, batch_agreements)
            pg_conn.commit()

        print("✅ Layaway Migration Completed.")
        
    except Exception as e:
        print(f"❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _flush_batch(cursor, txs, agreements):
    if txs:
        execute_values(cursor, """
            INSERT INTO store_transaction (
                id, legacy_ticketnum, customer_id, clerk_user_id, type_id, 
                occurred_at, amount, tax_sales, tax_exempt_used, state_tax, 
                tender_change, gun_proc_fee, note, created_at, updated_at, legacy_acct_pk
            ) VALUES %s ON CONFLICT (id) DO NOTHING
        """, txs)
        
    if agreements:
        execute_values(cursor, """
            INSERT INTO layaway_agreement (
                id, 
                ticketnum, clerk_user_id, date_in, last_updated_at,
                amount, tax_sales, state_tax, returned_amt, customer_id, 
                note, status, default_date, total_of_payments, period, 
                extra_note, gun_proc_fee, last_updated_user_id,
                inventory_number, number_sold, item_amount, description,
                tax_exempt, return_sold, item_status, county_tax_exempt,
                item_last_updated_user_id, items_id
            ) VALUES %s ON CONFLICT (id) DO NOTHING
        """, agreements)

if __name__ == "__main__":
    migrate_layaway()
