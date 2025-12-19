import pymssql
import psycopg2
from psycopg2.extras import execute_values
from psycopg2.extensions import register_adapter, AsIs
import json
import uuid
import os
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

# Register UUID adapter for psycopg2
def adapt_uuid(val):
    return AsIs(f"'{val}'")

register_adapter(uuid.UUID, adapt_uuid)

def migrate_transactions():
    print("🚀 Starting Transactions Migration (from Acct table)...")
    
    # Load Customer Map
    try:
        with open('customer_map.json', 'r') as f:
            customer_map = json.load(f)
    except:
        print("⚠️ customer_map.json not found. Transactions might have missing customers.")
        customer_map = {}

    # Load User Map
    try:
        with open('user_map.json', 'r') as f:
            user_map = json.load(f)
    except:
        user_map = {}

    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # 1. Fetch Transaction Types Map (Postgres)
        pg_cursor.execute("SELECT legacy_code, id FROM store_transaction_type WHERE legacy_code IS NOT NULL")
        tx_type_map = {row[0]: row[1] for row in pg_cursor.fetchall()}  # Keep as int (SMALLINT)
        
        # 2. Fetch Tender Types Map (Postgres)
        pg_cursor.execute("SELECT legacy_code, id FROM tender_type WHERE legacy_code IS NOT NULL")
        tender_map = {row[0]: row[1] for row in pg_cursor.fetchall()}  # Keep as int (SMALLINT)
        
        # 3. Fetch Pawn Tickets Map (control_number -> id)
        # We need this to link payments to tickets.
        # Assuming migrate_pawn.py has run and populated pawn_ticket.
        # We map control_number (TICKETNUM) to UUID.
        pg_cursor.execute("SELECT control_number, id FROM pawn_ticket")
        ticket_map = {row[0]: str(row[1]) for row in pg_cursor.fetchall()} 
        # print(f"Loaded {len(ticket_map)} tickets.")

        # 4. Fetch Acct Data
        # print("Fetching Acct Transactions...")
        # Fetch all relevant columns from Acct table
        query = """
            SELECT 
                Acct_PK, 
                Act_id,
                CUS_FK, 
                TICKETNUM, 
                TYPE, 
                DATEin, 
                AMOUNT,
                TAXSALES,
                STATETAX,
                TENDERTYP1, TENDERAMT1, 
                TENDERTYP2, TENDERAMT2,
                TENDCHANGE,
                OvrRideAmt,
                TOWHOM,
                Usr_FK
            FROM dbo.Acct
            WHERE DATEin > '1980-01-01'
            ORDER BY DATEin
        """
        mssql_cursor.execute(query)
        rows = mssql_cursor.fetchall()
        # print(f"Found {len(rows)} transactions")
        
        batch_size = 1000
        batch_tx = []
        batch_tenders = []
        batch_pawn_payments = []
        
        errors = 0
        
        errors = 0
        
        # print("Migrating...")
        for row in tqdm(rows):
            try:
                # Resolve Type
                legacy_type = (row['TYPE'] or '').strip()
                type_id = tx_type_map.get(legacy_type)
                
                # If unknown type, maybe skip or map to 'Unknown'?
                # For now skip if handled strictly, or log.
                if not type_id:
                    # errors += 1
                    # print(f"Unknown Transaction Type: {legacy_type}")
                    continue

                tx_id = str(uuid.uuid4())
                occurred_at = row['DATEin']
                amount = float(row['AMOUNT'] or 0)
                tax_sales = float(row['TAXSALES'] or 0) if row.get('TAXSALES') else None
                state_tax = float(row['STATETAX'] or 0) if row.get('STATETAX') else None
                tender_change = float(row['TENDCHANGE'] or 0) if row.get('TENDCHANGE') else None
                override_amount = float(row['OvrRideAmt'] or 0) if row.get('OvrRideAmt') else None
                note = str(row['TOWHOM'] or '').strip() if row.get('TOWHOM') else None
                
                # Customer link
                customer_pk = str(row['CUS_FK'])
                customer_id = customer_map.get(customer_pk)

                # Clerk link
                clerk_id = user_map.get(str(row['Usr_FK']))
                
                # Legacy PK linkage
                legacy_acct_pk = row['Acct_PK']
                legacy_acct_id = row.get('Act_id')
                legacy_ticketnum = str(row['TICKETNUM']).strip() if row['TICKETNUM'] else None
                legacy_cus_fk = str(row['CUS_FK']) if row.get('CUS_FK') else None
                legacy_usr_fk = str(row['Usr_FK']) if row.get('Usr_FK') else None

                created_at = occurred_at
                updated_at = occurred_at

                batch_tx.append((
                    tx_id,
                    legacy_acct_pk,
                    legacy_acct_id,
                    legacy_ticketnum,
                    legacy_cus_fk,
                    legacy_usr_fk,
                    customer_id,
                    clerk_id,
                    type_id,
                    occurred_at,
                    amount,
                    tax_sales,
                    state_tax,
                    tender_change,
                    override_amount,
                    note,
                    created_at,
                    updated_at
                ))
                
                # Tenders
                # Tender 1
                t1_code = str(row['TENDERTYP1']) if row['TENDERTYP1'] else None
                t1_amt = float(row['TENDERAMT1'] or 0)
                if t1_code and t1_amt != 0:
                    tid = tender_map.get(t1_code)
                    if tid:
                        batch_tenders.append((str(uuid.uuid4()), tx_id, 1, tid, t1_amt))
                
                # Tender 2
                t2_code = str(row['TENDERTYP2']) if row['TENDERTYP2'] else None
                t2_amt = float(row['TENDERAMT2'] or 0)
                if t2_code and t2_amt != 0:
                    tid = tender_map.get(t2_code)
                    if tid:
                        batch_tenders.append((str(uuid.uuid4()), tx_id, 2, tid, t2_amt))
                
                # Pawn Payment Linkage
                # If Type is 'PPP' (Pawn Payment) or 'PPU' (Redemption)
                # And we have a TICKETNUM
                ticket_num = str(row['TICKETNUM'] or '').strip()
                if ticket_num and legacy_type in ['PPP', 'PPU', 'P']:
                    ticket_uuid = ticket_map.get(ticket_num)
                    if ticket_uuid:
                        batch_pawn_payments.append((
                            str(uuid.uuid4()),
                            ticket_uuid,
                            tx_id,
                            occurred_at,
                            0, # Interest
                            amount, # Principal (Assume all principal for now, or total)
                            0,
                            clerk_id, # clerk_user_id
                            f"Legacy Acct Link: {ticket_num}",
                            occurred_at # created_at = payment_date
                        ))

                if len(batch_tx) >= batch_size:
                    _flush_batches(pg_cursor, batch_tx, batch_tenders, batch_pawn_payments)
                    pg_conn.commit()
                    batch_tx, batch_tenders, batch_pawn_payments = [], [], []

            except Exception as e:
                errors += 1
                if errors < 10: print(f"Error row: {e}")
        
        if batch_tx:
            _flush_batches(pg_cursor, batch_tx, batch_tenders, batch_pawn_payments)
            pg_conn.commit()
            
        print("✅ Transactions Migration Completed!")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _flush_batches(cursor, txs, tenders, payments):
    if txs:
        execute_values(cursor, """
            INSERT INTO store_transaction (
                id, legacy_acct_pk, legacy_acct_id, legacy_ticketnum, legacy_cus_fk, legacy_usr_fk,
                customer_id, clerk_user_id, type_id, occurred_at, amount, tax_sales, state_tax, 
                tender_change, override_amount, note, created_at, updated_at
            ) VALUES %s ON CONFLICT DO NOTHING
        """, txs)
    if tenders:
        execute_values(cursor, """
            INSERT INTO store_transaction_tender (
                id, store_transaction_id, sequence, tender_type_id, amount
            ) VALUES %s ON CONFLICT DO NOTHING
        """, tenders)
    if payments:
        execute_values(cursor, """
            INSERT INTO pawn_ticket_payment (
                id, pawn_ticket_id, store_transaction_id, payment_date, interest_paid, principal_paid, fees_paid, clerk_user_id, note, created_at
            ) VALUES %s ON CONFLICT DO NOTHING
        """, payments)

if __name__ == "__main__":
    migrate_transactions()
