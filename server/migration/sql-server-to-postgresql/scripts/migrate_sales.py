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
        # IDs for all relevant types
        SALE_TYPE_CODES = ['SL', 'SLD', 'SLP', 'SLU', 'SS', 'SSV', 'SLV']
        SALE_TYPE_IDS = [tx_types.get(code) for code in SALE_TYPE_CODES if tx_types.get(code)]
        if not SALE_TYPE_IDS:
            print("⚠ No valid store sale/layaway type IDs found! Control number update will fail.")
        # For legacy logic, keep RETAIL_SALE_ID for downstream use
        RETAIL_SALE_ID = tx_types.get('SS')
        if not RETAIL_SALE_ID:
            print("⚠ RETAIL_SALE type (SS) not found! sales will fail.")
            RETAIL_SALE_ID = '10'
        
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
        
        # Pre-fetch existing transactions (legacy_ticketnum -> id)
        print("Fetching existing transactions map...")
        pg_cursor.execute("SELECT legacy_ticketnum, id FROM store_transaction WHERE legacy_ticketnum IS NOT NULL")
        tx_map = {str(row[0]).strip(): str(row[1]) for row in pg_cursor.fetchall()}
        print(f"Loaded {len(tx_map)} existing transactions")
        
        # Load Inventory Map (inventory_number -> {id, status})
        print("Fetching Inventory Map (inventory_number -> {id, status})...")
        pg_cursor.execute("SELECT inventory_number, id, status FROM inventory_item WHERE inventory_number IS NOT NULL")
        inv_map = {str(row[0]).strip(): {'id': str(row[1]), 'status': row[2]} for row in pg_cursor.fetchall()}
        print(f"Loaded {len(inv_map)} inventory items")

        batch_size = 1000
        batch_tx = []
        batch_items = []
        batch_tenders = [] 
        
        errors = 0
        
        for row in tqdm(sales_rows):
            try:
                # IDs
                legacy_int_pk = row.get('Sold_pk')
                ticket_num = str(row.get('TICKETNUM')).strip()
                
                # Check if Transaction already migrated (via Acct table)
                existing_tx_id = tx_map.get(ticket_num)
                
                if existing_tx_id:
                     tx_id = existing_tx_id
                     # Do not insert Header or Tender (Accet has correct split)
                     # ONLY insert Items
                else:
                    # Phantom Sale (No Acct record?)
                    # Create new Header
                    tx_id = str(uuid.uuid4())
                    
                    customer_pk = str(row.get('CUS_FK'))
                    customer_id = customer_map.get(customer_pk)
                    if customer_id: customer_id = str(customer_id)
                    
                    batch_tx.append((
                        tx_id,
                        legacy_int_pk, # Mapped to legacy_acct_pk (BigInt)
                        customer_id,
                        RETAIL_SALE_ID,
                        row.get('DATEin'), 
                        row.get('SaleAmt'), 
                        row.get('TAX'),
                        safe_str(row.get('NOTE')),
                        ticket_num
                    ))
                    
                    # Map Tender (Assume Cash since Acct missing)
                    batch_tenders.append((
                        str(uuid.uuid4()),
                        tx_id,
                        1,
                        CASH_ID,
                        row.get('SaleAmt') 
                    ))
                
                # Map Items
                # Use TICKETNUM for lookup
                lookup_key = ticket_num
                                
                if lookup_key in items_map:
                    seq = 1
                    for item in items_map[lookup_key]:
                         invnum = str(item.get('INVNUM') or '').strip()
                         inv_data = inv_map.get(invnum)
                         inv_uuid = inv_data['id'] if inv_data else None
                         
                         # Status priority: sitems.Status (Historical) -> Inventory Status (Current) -> 'S' (Default)
                         sitems_status = str(item.get('Status') or '').strip()
                         
                         if sitems_status:
                             status = sitems_status
                         elif inv_data and inv_data.get('status'):
                             status = inv_data['status']
                         else:
                             status = 'S'

                         batch_items.append((
                             str(uuid.uuid4()),
                             tx_id,
                             seq,
                             safe_str(item.get('DESCRIPT')),
                             float(item.get('QTY') or 1),
                             item.get('AMOUNT'), 
                             item.get('COST'),
                             safe_str(item.get('Items_FK')),
                             inv_uuid,
                             status
                         ))
                         seq += 1
                
                if len(batch_tx) >= batch_size:
                    _flush_batches(pg_cursor, batch_tx, batch_items, batch_tenders)
                    pg_conn.commit()
                    batch_tx, batch_items, batch_tenders = [], [], []

            except Exception as e:
                pg_conn.rollback()
                errors += 1
                if errors < 10:
                    print(f"❌ Error processing sale {row.get('SLD_id')}: {e}")
        
        if batch_tx or batch_items:
            _flush_batches(pg_cursor, batch_tx, batch_items, batch_tenders)
            pg_conn.commit()
            
        print(f"✅ Sales Migration Completed! Errors: {errors}")
        
        # Update app_settings for next control numbers (store_sale_control_number_next)
        try:
            if SALE_TYPE_IDS:
                # Build a tuple for SQL IN clause
                sql_in = ','.join(['%s'] * len(SALE_TYPE_IDS))
                # Use regex to ensure only numeric ticketnums are considered
                pg_cursor.execute(f'''
                    SELECT MAX(legacy_ticketnum::integer) FROM store_transaction 
                    WHERE type_id IN ({sql_in}) AND legacy_ticketnum ~ '^[0-9]+$'
                ''', SALE_TYPE_IDS)
                max_store_sale_control = pg_cursor.fetchone()[0]
                if max_store_sale_control is not None:
                    next_control = str(int(max_store_sale_control) + 1)
                    pg_cursor.execute("""
                        UPDATE app_settings 
                        SET value = %s, updated_at = NOW() 
                        WHERE key = 'store_sale_control_number_next'
                    """, (next_control,))
                    print(f"   Set store_sale_control_number_next to {next_control}")
                else:
                    print("   No valid store sale control number found; app_settings not updated.")
            else:
                print("   No sale/layaway type IDs found; app_settings not updated.")
        except Exception as e:
            print(f"   Error updating store_sale_control_number_next: {e}")
        pg_conn.commit()
        
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
                id, legacy_acct_pk, customer_id, type_id, occurred_at, amount, tax_sales, note, legacy_ticketnum
            ) VALUES %s ON CONFLICT DO NOTHING
        """, txs)
    if items:
         execute_values(cursor, """
            INSERT INTO store_transaction_item (
                id, store_transaction_id, sequence, description, quantity, line_amount, line_cost, legacy_items_pk, inventory_item_id, status
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
