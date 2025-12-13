import pymssql
import psycopg2
from psycopg2.extras import execute_values
import uuid
import os
import sys
from tqdm import tqdm

# Add current directory (scripts) and its parent to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.dirname(current_dir))

from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def migrate_hold_items():
    print("🚀 Starting HoldConItems Migration (Hold <-> Inventory Link)...")
    
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # 1. Fetch HoldConItems joined with parent keys to resolve UUIDs
        # HoldConItems: hci_pk, hc_fk, items_fk
        # holdcon: hc_pk, HCN_id
        # items: ITEMS_PK, Items_ID
        print("Fetching HoldConItems + UUIDs from SQL Server...")
        query = """
            SELECT 
                hci.HCI_id,
                hc.HCN_id AS hold_uuid,
                i.Items_ID AS item_uuid
            FROM HoldConItems hci
            JOIN holdcon hc ON hci.hc_fk = hc.hc_pk
            JOIN items i ON hci.items_fk = i.ITEMS_PK
            WHERE hc.HCN_id IS NOT NULL AND i.Items_ID IS NOT NULL
        """
        mssql_cursor.execute(query)
        rows = mssql_cursor.fetchall()
        print(f"Found {len(rows)} HoldConItem links to migrate.")
        
        batch_data = []
        batch_size = 1000
        migrated_count = 0
        
        for row in tqdm(rows):
            hold_uuid = str(row['hold_uuid'])
            item_uuid = str(row['item_uuid'])
            
            # Use HCI_id as PK if available, else random
            # ID is just for the row, relation is what matters
            record_id = str(row['HCI_id']) if row.get('HCI_id') else str(uuid.uuid4())
            
            batch_data.append((
                record_id,
                hold_uuid,
                item_uuid
            ))
            
            if len(batch_data) >= batch_size:
                _insert_batch(pg_cursor, batch_data)
                pg_conn.commit()
                migrated_count += len(batch_data)
                batch_data = []

        if batch_data:
            _insert_batch(pg_cursor, batch_data)
            pg_conn.commit()
            migrated_count += len(batch_data)
            
        print(f"\n✅ Hold Items Migration Completed!")
        print(f"   Links Created: {migrated_count}")

    except Exception as e:
        print(f"❌ Migration Failed: {e}")
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _insert_batch(cursor, data):
    sql = """
        INSERT INTO hold_item_inventory (
            id, hold_item_id, inventory_item_id
        ) VALUES %s
        ON CONFLICT (hold_item_id, inventory_item_id) DO NOTHING
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_hold_items()
