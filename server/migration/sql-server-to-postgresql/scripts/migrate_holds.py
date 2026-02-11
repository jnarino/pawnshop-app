import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
import sys
from tqdm import tqdm
from datetime import datetime

# Add current directory (scripts) and its parent (sql-server-to-postgresql) to sys.path
# so we can import config safely
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.dirname(current_dir))

from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    if value is None:
        return None
    return str(value).strip() if value else None

def migrate_holds():
    print("🚀 Starting Police Hold Migration...")
    
    # Load User Map
    try:
        with open('user_map.json', 'r') as f:
            user_map = json.load(f)
    except FileNotFoundError:
        print("❌ user_map.json not found. Run migrate_users first.")
        user_map = {}

    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # 1. Fetch holdcon data
        print("Fetching holdcon records from SQL Server...")
        mssql_cursor.execute("SELECT * FROM holdcon")
        rows = mssql_cursor.fetchall()
        print(f"Found {len(rows)} records to migrate.")
        
        batch_data = []
        batch_size = 1000
        errors = 0
        
        for row in tqdm(rows):
            try:
                # Map Fields
                control_number = safe_str(row.get('LookupKey'))
                
                # Map Clerk User (emp_fk)
                emp_fk = safe_str(row.get('emp_fk'))
                clerk_user_id = user_map.get(emp_fk) if emp_fk else None
                
                # Map User (LastUpdatedUSR_ID)
                # This field was a FK to USR in SQL Server? Inspect output says it was UUID '5c8e6a...'
                # Wait, inspect output showed LastUpdatedUSR_ID as UUID. 
                # Our user_map keys might be integers (legacy USR_PK).
                # But if SQL Server already had UUIDs, we need to replicate or map them.
                # However, earlier migration of users used USR_PK (int).
                # Let's check if user_map has UUID keys or Int keys.
                # If LastUpdatedUSR_ID is a UUID in source, and users table has UUIDs, maybe it matches?
                # But SQL Server usually doesn't use UUID unless v2 was modern.
                # Let's try to map it if possible, otherwise leave NULL.
                legacy_user_id = str(row.get('LastUpdatedUSR_ID')) if row.get('LastUpdatedUSR_ID') else None
                updated_by = user_map.get(legacy_user_id) # Try exact match?
                
                # If not found, check if it maps to legacy integer key? 
                # (Unlikely given UUID format).
                
                # Dates
                hold_date = row.get('date')
                date_out = row.get('dateout')
                
                # Booleans (1=True?, 2=False?)
                # Inspect showed 'ishold': 1, 'isinv': 2.
                # Assuming 1=Yes, 2=No (Classic legacy pattern).
                # Or 1=True, 0=False.
                # Let's assume 1 is True.
                is_hold = True if row.get('ishold') == 1 else False
                is_inventory = True if row.get('isinv') == 1 else False
                
                batch_data.append((
                    safe_str(row.get('HCN_id')) or str(uuid.uuid4()), # id (Use HCN_id if valid UUID)
                    control_number,
                    clerk_user_id,
                    hold_date,
                    safe_str(row.get('agency')),
                    safe_str(row.get('casenum')),
                    date_out,
                    is_hold,
                    is_inventory,
                    safe_str(row.get('itemlist')),
                    safe_str(row.get('comment')),
                    safe_str(row.get('agentln')),
                    safe_str(row.get('agentfn')),
                    safe_str(row.get('agentmi')),
                    safe_str(row.get('badge')),
                    safe_str(row.get('ac1')),
                    safe_str(row.get('phone1')),
                    safe_str(row.get('ext1')),
                    safe_str(row.get('jurisdict')),
                    safe_str(row.get('HCN_id')), # legacy_hcn_id
                    updated_by,
                    hold_date
                ))
                
                if len(batch_data) >= batch_size:
                    _insert_batch(pg_cursor, batch_data)
                    pg_conn.commit()
                    batch_data = []

            except Exception as e:
                errors += 1
                print(f"Error processing row {row.get('hc_pk')}: {e}")
                
        if batch_data:
            _insert_batch(pg_cursor, batch_data)
            pg_conn.commit()
            
        print(f"\n✅ Police Hold Migration Completed!")
        print(f"   Migrated: {len(rows) - errors}")
        print(f"   Errors: {errors}")

    except Exception as e:
        print(f"❌ Migration Failed: {e}")
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _insert_batch(cursor, data):
    sql = """
        INSERT INTO hold_item (
            id, control_number, clerk_user_id, hold_date, agency, case_number,
            date_out, is_hold, is_inventory, item_list, comment,
            agent_last_name, agent_first_name, agent_middle_initial, badge_number,
            phone_area_code, phone_number, phone_extension, jurisdiction,
            legacy_hcn_id, updated_by, created_at
        ) VALUES %s
        ON CONFLICT (id) DO NOTHING
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_holds()
