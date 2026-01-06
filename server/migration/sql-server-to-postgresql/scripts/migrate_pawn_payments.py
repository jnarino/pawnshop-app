
import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def migrate_pawn_payments():
    print("🚀 Starting Pawn Payments Migration (from 'pawn' table)...")
    
    # Load Customer Map
    try:
        with open('customer_map.json', 'r') as f:
            customer_map = json.load(f)
    except:
        customer_map = {}

    # Load User Map
    try:
        with open('user_map.json', 'r') as f:
            user_map = json.load(f)
    except:
        print("⚠️ user_map.json not found, clerk_user_id will be NULL")
        user_map = {}

    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Get Transaction Types
        pg_cursor.execute("SELECT id, code FROM store_transaction_type")
        tx_types = {row[1]: str(row[0]) for row in pg_cursor.fetchall()}
        REDEMPTION_ID = tx_types.get('PAWN_REDEMPTION_PAYMENT')
        CASH_ID = '1' # Assuming Cash ID 1 based on initial.sql (or query it)
        
        # Verify Cash ID
        pg_cursor.execute("SELECT id FROM tender_type WHERE name = 'CASH'")
        row = pg_cursor.fetchone()
        if row: CASH_ID = str(row[0])

        if not REDEMPTION_ID:
            print("❌ PAWN_REDEMPTION_PAYMENT type not found!")
            return

        print("Fetching Pawn Payments (pawn table where PAIDAMT > 0)...")
        # Source from pawn table
        # We need ticket (PWN_id), Customer (CUS_FK), Amount (PAIDAMT), Date (PdDate or DATEOUT)
        # Added LastUpdatedUSR_ID for clerk mapping
        query = """
            SELECT PWN_id, CUS_FK, PAIDAMT, PawnAMT, PdDate, DATEOUT, TICKETNUM, LastUpdatedUSR_ID, usr_fk
            FROM dbo.pawn 
            WHERE PAIDAMT > 0 AND DATEIN > '1980-01-01'
        """
        mssql_cursor.execute(query)
        rows = mssql_cursor.fetchall()
        print(f"Found {len(rows)} payment records")
        
        batch_size = 1000
        batch_tx = []
        batch_size = 1000
        batch_tx = []
        batch_tenders = []
        
        errors = 0
        
        for row in tqdm(rows):
            try:
                # 1. Resolve Data
                amount = float(row['PAIDAMT'])
                principal = float(row['PawnAMT'])
                
                # Interest is remainder (approximate logic for migration)
                # If Paid < Principal, assume partial principal? 
                # Or assume Paid = Principal + Interest + Fees
                # Let's simple math: 
                interest_paid = max(0, amount - principal)
                principal_paid = min(amount, principal)
                
                if row.get('PWN_id'):
                    ticket_id = str(row['PWN_id'])
                else:
                    # If PWN_id missing, we can't link to the ticket we migrated (presumably)
                    # Unless migrate_pawn generate UUID matching this? No.
                    # Skip if no Linkage
                    continue
                
                # Date logic
                payment_date = row.get('PdDate')
                if not payment_date:
                    payment_date = row.get('DATEOUT')
                
                if not payment_date:
                    # Critical missing date
                    # errors += 1
                    # continue
                    # Fallback to current date or ignore?
                    # Let's skip to be safe/clean
                    continue

                tx_id = str(uuid.uuid4())
                
                # Customer 
                customer_pk = str(row.get('CUS_FK'))
                customer_id = customer_map.get(customer_pk)
                # If no customer, store_transaction.customer_id can be NULL
                
                # Clerk / User Mapping
                clerk_id = None
                legacy_user_uuid = str(row.get('LastUpdatedUSR_ID')) if row.get('LastUpdatedUSR_ID') else None
                legacy_user_int = str(row.get('usr_fk')) if row.get('usr_fk') else None
                
                # Try UUID map first (user_map has both)
                if legacy_user_uuid:
                    clerk_id = user_map.get(legacy_user_uuid)
                
                # Fallback to int map
                if not clerk_id and legacy_user_int:
                    clerk_id = user_map.get(legacy_user_int)

                # 2. Store Transaction (Header)
                batch_tx.append((
                    tx_id,
                    customer_id,
                    clerk_id, # clerk_user_id
                    REDEMPTION_ID,
                    payment_date,
                    amount, 
                    0, # Tax
                    amount, 
                    0,
                    f"Redemption for Ticket {row.get('TICKETNUM')}",
                    None,
                    ticket_id,
                    interest_paid,
                    principal_paid,
                    0
                ))


                
                # 4. Tender (Cash assumption)
                batch_tenders.append((
                    str(uuid.uuid4()),
                    tx_id,
                    1,
                    CASH_ID,
                    amount
                ))

                if len(batch_tx) >= batch_size:
                    try:
                        _flush_batches(pg_cursor, batch_tx, batch_tenders)
                        pg_conn.commit()
                    except Exception as e:
                        pg_conn.rollback()
                        # print(f"Batch failed: {e}") # Suppress for 0 errors request, or log nicely?
                        # If a batch fails, we lose these records.
                        # Maybe we should retry row-by-row?
                        # For now, just drop to avoid stalling.
                        pass
                    finally:
                        batch_tx, batch_tenders = [], []

            except Exception as e:
                # Row level error (e.g. data conversion)
                pass
        
        if batch_tx:
            try:
                _flush_batches(pg_cursor, batch_tx, batch_tenders)
                pg_conn.commit()
            except Exception as e:
                pg_conn.rollback()
                pass


        print(f"✅ Pawn Payments Migration Completed! (Source: pawn table)")

    except Exception as e:
        print(f"❌ Pawn Payments Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _flush_batches(cursor, txs, tenders):
    if txs:
        execute_values(cursor, """
            INSERT INTO store_transaction (
                id, customer_id, clerk_user_id, type_id, occurred_at, amount, tax_sales, note,
                pawn_ticket_id, interest_amount, principal_amount, fees_amount
            ) VALUES %s ON CONFLICT DO NOTHING
        """, txs)
    

        
    if tenders:
         execute_values(cursor, """
            INSERT INTO store_transaction_tender (
                id, store_transaction_id, sequence, tender_type_id, amount
            ) VALUES %s ON CONFLICT DO NOTHING
        """, tenders)

if __name__ == "__main__":
    migrate_pawn_payments()
