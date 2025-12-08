
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

def migrate_sales():
    print("🚀 Starting Sales Migration...")
    
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
        
        # Get Transaction Types
        pg_cursor.execute("SELECT id, code FROM store_transaction_type")
        tx_types = {row[1]: str(row[0]) for row in pg_cursor.fetchall()}
        RETAIL_SALE_ID = tx_types.get('RETAIL_SALE', '00000000-0000-0000-0000-000000000000')
        
        # Get Tender Types (Assuming mapped by name or legacy code)
        pg_cursor.execute("SELECT id, name FROM tender_type")
        tender_types = {row[1]: str(row[0]) for row in pg_cursor.fetchall()}
        CASH_ID = tender_types.get('CASH', '00000000-0000-0000-0000-000000000000')
        
        # Fetch Sales Headers (sold)
        print("Fetching Sales Headers (sold table)...")
        # Filter for Sales (Exclude Layaways 'L', etc if needed. Assuming 'S' or NULL = Sale)
        query = "SELECT * FROM dbo.sold WHERE DATEin > '1980-01-01' AND TRANS <> 'L' ORDER BY DATEin"
        mssql_cursor.execute(query)
        sales_rows = mssql_cursor.fetchall()
        print(f"Found {len(sales_rows)} sales records")

        # Fetch Sales Items (sitems) into memory map
        print("Fetching Sales Items (sitems table)...")
        mssql_cursor.execute("SELECT * FROM dbo.sitems")
        items_rows = mssql_cursor.fetchall()
        
        # Group items by SOLD_FK
        # Group items by TICKETNUM
        items_map = {}
        for item in items_rows:
            # Use TICKETNUM as key to match lookup logic
            key = str(item.get('TICKETNUM')).strip()
            if key and key != 'None':
                if key not in items_map: items_map[key] = []
                items_map[key].append(item)
        
        batch_size = 1000
        batch_tx = []
        batch_items = []
        batch_tenders = [] 
        
        errors = 0
        
        for row in tqdm(sales_rows):
            try:
                # IDs
                # Use Sold_pk (int) for legacy_acct_pk (BigInt)
                legacy_int_pk = row.get('Sold_pk')
                # SLD_id is UUID, unused for legacy_acct_pk
                
                tx_id = str(uuid.uuid4())
                
                customer_pk = str(row.get('CUS_FK'))
                customer_id = customer_map.get(customer_pk)
                if customer_id: customer_id = str(customer_id)
                
                # Filter Types? If Status='L', skip (Layaway handled separately)
                # Double check status if needed, but TRANS filter handles specific types.

                # Map Header
                batch_tx.append((
                    tx_id,
                    legacy_int_pk, # Mapped to legacy_acct_pk (BigInt)
                    customer_id,
                    RETAIL_SALE_ID,
                    row.get('DATEin'), 
                    row.get('SaleAmt'), 
                    row.get('TAX'),
                    safe_str(row.get('NOTE'))
                ))
                
                # Map Items
                # Use TICKETNUM for lookup
                lookup_key = str(row.get('TICKETNUM')).strip()
                                
                if lookup_key in items_map:
                    seq = 1
                    for item in items_map[lookup_key]:
                         batch_items.append((
                             str(uuid.uuid4()),
                             tx_id,
                             seq,
                             safe_str(item.get('DESCRIPT')),
                             float(item.get('QTY') or 1),
                             item.get('AMOUNT'), 
                             item.get('COST'),
                             safe_str(item.get('Items_FK'))
                         ))
                         seq += 1
                
                # Map Tender
                batch_tenders.append((
                    str(uuid.uuid4()),
                    tx_id,
                    1,
                    CASH_ID,
                    row.get('SaleAmt') # Updated from AMOUNT
                ))

                if len(batch_tx) >= batch_size:
                    _flush_batches(pg_cursor, batch_tx, batch_items, batch_tenders)
                    pg_conn.commit()
                    batch_tx, batch_items, batch_tenders = [], [], []

            except Exception as e:
                pg_conn.rollback()
                errors += 1
                if errors < 10:
                    print(f"❌ Error processing sale {row.get('SLD_id')}: {e}")
        
        if batch_tx:
            _flush_batches(pg_cursor, batch_tx, batch_items, batch_tenders)
            pg_conn.commit()
            
        print(f"✅ Sales Migration Completed! Errors: {errors}")
        
    except Exception as e:
        print(f"❌ Sales Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _flush_batches(cursor, txs, items, tenders):
    if txs:
        execute_values(cursor, """
            INSERT INTO store_transaction (
                id, legacy_acct_pk, customer_id, type_id, occurred_at, amount, tax_sales, note
            ) VALUES %s ON CONFLICT DO NOTHING
        """, txs)
    if items:
         execute_values(cursor, """
            INSERT INTO store_transaction_item (
                id, store_transaction_id, sequence, description, quantity, line_amount, line_cost, legacy_items_pk
            ) VALUES %s ON CONFLICT DO NOTHING
        """, items)
    if tenders:
         execute_values(cursor, """
            INSERT INTO store_transaction_tender (
                id, store_transaction_id, sequence, tender_type_id, amount
            ) VALUES %s ON CONFLICT DO NOTHING
        """, tenders)

if __name__ == "__main__":
    migrate_sales()
