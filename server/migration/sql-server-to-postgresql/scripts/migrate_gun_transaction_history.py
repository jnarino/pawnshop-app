import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    """Safely convert value to string, strip whitespace and NUL bytes"""
    if value is None:
        return None
    # Convert to string, remove NUL bytes, then strip whitespace
    return str(value).replace('\x00', '').strip() if value else None

def migrate_gun_transaction_history():
    print("🚀 Starting Gun Transaction History Migration...")
    
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
        
        # Build gun transaction type mapping
        print("Building gun transaction type mapping...")
        pg_cursor.execute("SELECT id, code FROM gun_transaction_type")
        gun_tx_type_map = {row[1]: str(row[0]) for row in pg_cursor.fetchall()}
        
        if not gun_tx_type_map:
            print("❌ No gun transaction types found! Run initial migration first.")
            return
        
        # Fetch gun transactions from SQL Server
        print("Fetching gun transaction records from SQL Server...")
        mssql_cursor.execute("""
            SELECT 
                gt.gt_Pk,
                gt.invnum,
                gt.items_pk,
                gt.gt_date,
                gt.gt_type,
                gt.usr_fk,
                gt.comment1,
                gt.GNT_id
            FROM dbo.guntrans gt
            ORDER BY gt.gt_Pk
        """)
        
        records = mssql_cursor.fetchall()
        print(f"Found {len(records)} gun transaction records to migrate")
        
        if records:
            print(f"Sample Row Keys: {records[0].keys()}")
        
        # Build mapping of items_pk to inventory_item_id
        print("Building inventory item mapping...")
        pg_cursor.execute("""
            SELECT legacy_item_guid, id 
            FROM inventory_item 
            WHERE legacy_item_guid IS NOT NULL
        """)
        item_uuid_map = {str(row[0]): str(row[1]) for row in pg_cursor.fetchall()}
        
        # Also map by legacy_inventory_number in case items_pk was stored there
        pg_cursor.execute("""
            SELECT legacy_inventory_number, id 
            FROM inventory_item 
            WHERE legacy_inventory_number IS NOT NULL
        """)
        item_invnum_map = {str(row[0]): str(row[1]) for row in pg_cursor.fetchall()}
        
        batch_size = 1000
        batch_data = []
        errors = 0
        matched_items = 0
        unmatched_items = 0
        
        print("Migrating...")
        for row in tqdm(records):
            try:
                # Generate UUID for transaction history record
                transaction_id = str(uuid.uuid4())
                
                # Map inventory item
                inventory_number = safe_str(row.get('invnum'))
                inventory_item_id = None
                
                # Try to find inventory item by legacy number
                if inventory_number:
                    inventory_item_id = item_invnum_map.get(inventory_number)
                
                if inventory_item_id:
                    matched_items += 1
                else:
                    unmatched_items += 1
                
                # Parse transaction type
                transaction_type = safe_str(row.get('gt_type'))
                type_id = None
                if transaction_type:
                    # Try direct lookup first
                    type_id = gun_tx_type_map.get(transaction_type)
                    # If not found, try to match common variants
                    if not type_id:
                        # Handle common variations/mappings
                        type_mapping = {
                            'PAWN': 'PAWN',
                            'REDEMPTION': 'REDEEMED',
                            'REDEEM': 'REDEEMED',
                            'REDEEMED': 'REDEEMED',
                            'SALE': 'SALE',
                            'SOLD': 'SOLD',
                            'BUY': 'BUY',
                            'PURCHASE': 'BUY',
                            'PICKED UP': 'PICKED UP',
                            'RETURN': 'RETURNED',
                            'RETURNED': 'RETURNED',
                            'TRANSFER': 'TRANSFER',
                            'TRANSFERRED': 'TRANSFER',
                            'HOLD': 'HOLD',
                            'RELEASE': 'RELEASE',
                            'CONFISCATE': 'CONFISCATE',
                            'CONFISCATION': 'CONFISCATE',
                            'VOID': 'VOID',
                            'VOID SALE': 'VOID SALE',
                            'VOID PAWN': 'VOID',
                            'CHANGE': 'CHANGE',
                            'UNDO REDEE': 'UNDO REDEE',
                            'DELETE': 'DELETE',
                            'INVENTORY': 'INVENTORY'
                        }
                        mapped_type = type_mapping.get(transaction_type.upper())
                        if mapped_type:
                            type_id = gun_tx_type_map.get(mapped_type)
                
                
                # Parse date
                transaction_date = row.get('gt_date')
                
                # Map user
                clerk_user_id = None
                usr_fk = row.get('usr_fk')
                if usr_fk:
                    clerk_user_id = user_map.get(str(usr_fk))
                
                # Get notes
                notes = safe_str(row.get('comment1'))
                
                # Legacy GUID
                legacy_gnt_id = None
                gnt_id = row.get('GNT_id')
                if gnt_id:
                    try:
                        legacy_gnt_id = str(gnt_id)
                    except:
                        pass
                
                batch_data.append((
                    transaction_id,
                    inventory_number,
                    inventory_item_id,
                    transaction_date,
                    type_id,
                    clerk_user_id,
                    notes,
                    legacy_gnt_id
                ))
                
                if len(batch_data) >= batch_size:
                    try:
                        _insert_batch(pg_cursor, batch_data)
                        pg_conn.commit()
                    except Exception as e:
                        pg_conn.rollback()
                        errors += len(batch_data)
                        if errors < 100:
                            print(f"  Batch error: {e}")
                    batch_data = []
                    
            except Exception as e:
                errors += 1
                if errors < 10:
                    print(f"  Error processing gun transaction {row.get('gt_Pk')}: {e}")
        
        # Insert remaining
        if batch_data:
            try:
                _insert_batch(pg_cursor, batch_data)
                pg_conn.commit()
            except Exception as e:
                pg_conn.rollback()
                errors += len(batch_data)
                print(f"  Final batch error: {e}")
        
        print(f"\n✅ Gun Transaction History Migration Completed!")
        print(f"   Total Records: {len(records)}")
        print(f"   Matched to Inventory Items: {matched_items}")
        print(f"   Unmatched (no inventory_item_id): {unmatched_items}")
        print(f"   Errors: {errors}")
        
    except Exception as e:
        if 'pg_conn' in locals():
            pg_conn.rollback()
        print(f"❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _insert_batch(cursor, data):
    sql = """
        INSERT INTO gun_transaction_history (
            id,
            inventory_number,
            inventory_item_id,
            transaction_date,
            type_id,
            clerk_user_id,
            notes,
            legacy_GNT_id
        ) VALUES %s
        ON CONFLICT (id) DO NOTHING
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_gun_transaction_history()
