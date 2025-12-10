
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
        
        # Pre-fetch existing transactions (legacy_ticketnum -> id)
        # print("Fetching existing transactions map...")
        pg_cursor.execute("SELECT legacy_ticketnum, id FROM store_transaction WHERE legacy_ticketnum IS NOT NULL")
        tx_map = {str(row[0]).strip(): str(row[1]) for row in pg_cursor.fetchall()}

        batch_size = 1000
        batch_agreements = []
        batch_deposits = [] 

        # Fetch Layaway Data
        # print("Fetching Layaway data from SQL Server...")
        mssql_cursor.execute("SELECT * FROM dbo.Sold WHERE TRANS = 'L' AND DATEin > '1980-01-01'")
        lay_rows = mssql_cursor.fetchall()
        # print(f"Found {len(lay_rows)} layaway records")
        
        for row in tqdm(lay_rows):
            try:
                # IDs
                # Use Sold_pk (int) for legacy_acct_pk (BigInt)
                legacy_int_pk = row.get('Sold_pk')
                ticket_num = str(row.get('TICKETNUM')).strip()
                
                # Check for existing transaction
                existing_tx_id = tx_map.get(ticket_num)
                
                if existing_tx_id:
                    deposit_tx_id = existing_tx_id
                    # Don't create new deposit transaction
                else:
                    # Phantom
                    deposit_tx_id = str(uuid.uuid4())
                    customer_pk = str(row.get('CUS_FK'))
                    customer_id = customer_map.get(customer_pk)
                    if customer_id: customer_id = str(customer_id)
                    
                    batch_deposits.append((
                        deposit_tx_id,
                        legacy_int_pk, 
                        customer_id,
                        LAYAWAY_DEPOSIT_ID,
                        row.get('DATEin'),
                        row.get('DEPOSIT') or 0, 
                        0, 
                        f"Layaway Deposit for Agreement {legacy_int_pk}",
                        ticket_num
                    ))

                # Still need Agreement ID
                agreement_id = str(uuid.uuid4())
                
                # ... Status logic ...
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
                   row.get('DEPOSIT') or 0,
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
                id, legacy_acct_pk, customer_id, type_id, occurred_at, amount, tax_sales, note, legacy_ticketnum
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
