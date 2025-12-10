
import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    if value is None: return None
    return str(value).replace('\x00', '').strip() if value else None

def migrate_layaway():
    print("🚀 Starting Layaway Migration...")
    
    # Load Customer Map
    try:
        with open('customer_map.json', 'r') as f:
            customer_map = json.load(f)
    except:
        print("⚠ customer_map.json not found. FKs will be skipped.")
        customer_map = {}

    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Get Store Transaction ID for LAYAWAY_DEPOSIT
        pg_cursor.execute("SELECT id FROM store_transaction_type WHERE code = 'LAYAWAY_DEPOSIT'")
        lid_row = pg_cursor.fetchone()
        LAYAWAY_DEPOSIT_ID = str(lid_row[0]) if lid_row else '00000000-0000-0000-0000-000000000000'
        
        print("Fetching Layaways (from sold table)...")
        # Source from sold where TRANS = 'L'
        query = "SELECT * FROM dbo.sold WHERE TRANS = 'L' ORDER BY DATEin"
        mssql_cursor.execute(query)
        lay_rows = mssql_cursor.fetchall()
        print(f"Found {len(lay_rows)} layaway records")
        
        batch_size = 1000
        batch_agreements = []
        batch_deposits = [] 
        
        for row in tqdm(lay_rows):
            try:
                # IDs
                # Use Sold_pk (int) for legacy_acct_pk (BigInt)
                legacy_int_pk = row.get('Sold_pk')
                # SLD_id (UUID) unused for legacy_acct_pk
                
                # We still need a unique ID for the Agreement description if strictly needed, 
                # but 'legacy_pk' variable was mostly used for that.
                
                agreement_id = str(uuid.uuid4())
                deposit_tx_id = str(uuid.uuid4())
                
                customer_pk = str(row.get('CUS_FK'))
                customer_id = customer_map.get(customer_pk)
                if customer_id: customer_id = str(customer_id)
                
                date = row.get('DATEin') 
                amount = row.get('SaleAmt') 
                deposit = row.get('DEPOSIT') or 0 
                
                # 1. Create Store Transaction for the Deposit
                batch_deposits.append((
                    deposit_tx_id,
                    legacy_int_pk, # Mapped to legacy_acct_pk (BigInt)
                    customer_id,
                    LAYAWAY_DEPOSIT_ID,
                    date,
                    deposit, 
                    0, 
                    f"Layaway Deposit for Agreement {legacy_int_pk}"
                ))

                # 2. Create Layaway Agreement
                status = 'active' 
                if safe_str(row.get('STATUS')) == 'C': status = 'completed'
                if safe_str(row.get('STATUS')) == 'V': status = 'voided'

                batch_agreements.append((
                   agreement_id,
                   deposit_tx_id,
                   status,
                   0, 
                   0, 
                   0, 
                   deposit,
                   30, 
                   row.get('Laylate'), 
                   row.get('sld_Message'),
                   row.get('Reminder') == 1,
                   row.get('CountyTaxable')
                ))
                
                if len(batch_agreements) >= batch_size:
                    _flush_layaways(pg_cursor, batch_deposits, batch_agreements)
                    pg_conn.commit()
                    batch_deposits, batch_agreements = [], []

            except Exception as e:
                pg_conn.rollback()
                import traceback
                print(f"❌ Error processing layaway {row.get('SLD_id')}: {e}")
        
        if batch_agreements:
            _flush_layaways(pg_cursor, batch_deposits, batch_agreements)
            pg_conn.commit()

        print("✅ Layaway Migration Completed!")

    except Exception as e:
        print(f"❌ Layaway Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _flush_layaways(cursor, deposits, agreements):
    # Insert Deposit Transaction first (Required by FK)
    if deposits:
        execute_values(cursor, """
            INSERT INTO store_transaction (
                id, legacy_acct_pk, customer_id, type_id, occurred_at, amount, tax_sales, note
            ) VALUES %s ON CONFLICT DO NOTHING
        """, deposits)
    
    # Insert Agreement
    if agreements:
        execute_values(cursor, """
            INSERT INTO layaway_agreement (
                id, sale_store_tx_id, status, service_charge_percent, service_charge_grace_days,
                service_charge_amount, deposit, period_days, late_fee, message, reminder, county_taxable
            ) VALUES %s ON CONFLICT DO NOTHING
        """, agreements)

if __name__ == "__main__":
    migrate_layaway()
