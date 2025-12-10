import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
from tqdm import tqdm
from datetime import datetime
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    """Safely convert value to string, strip whitespace and NUL bytes"""
    if value is None:
        return None
    # Convert to string, remove NUL bytes, then strip whitespace
    return str(value).replace('\x00', '').strip() if value else None

def migrate_gunlog():
    print("🚀 Starting Gun Log Migration...")
    
    # Load Customer Map
    try:
        with open('customer_map.json', 'r') as f:
            customer_map = json.load(f)
    except FileNotFoundError:
        print("❌ customer_map.json not found. Run migrate_customers_v2.py first.")
        return
    
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Fetch gun log records
        print("Fetching gun log records from SQL Server...")
        mssql_cursor.execute("""
            SELECT * FROM dbo.gunlog 
            ORDER BY GunLogNum
        """)
        
        records = mssql_cursor.fetchall()
        print(f"Found {len(records)} gun log records to migrate")
        
        batch_size = 1000
        batch_data = []
        errors = 0
        
        print("Migrating...")
        for row in tqdm(records):
            try:
                # Use source UUID if available
                gunlog_id = str(row['GUN_id']) if row.get('GUN_id') else str(uuid.uuid4())
                
                # Map inventory item (if linked)
                # Note: We don't have an inventory map, but we used source UUIDs for items
                # However, dbo.gunlog doesn't seem to have ITEMS_PK directly? 
                # It has INVNUM. We might need to look up item ID by INVNUM if not directly linked.
                # Wait, the schema analysis showed 'GUN_id' but not 'ITEMS_PK'.
                # Let's check if INVNUM can be used to find the item.
                # For now, we'll leave inventory_item_id NULL unless we can link it.
                inventory_item_id = None
                
                # Map customers
                # Acquisition customer (from whom the gun was acquired)
                # dbo.gunlog doesn't seem to have CUS_FK for acquisition?
                # It has BUYFNAME etc.
                acquisition_customer_id = None
                
                # Disposition customer (to whom the gun was sold)
                disposition_customer_id = None
                
                # Construct address strings
                acq_addr = safe_str(row.get('BUYADD1'))
                if row.get('BuyAdd2'): acq_addr += " " + safe_str(row.get('BuyAdd2'))
                
                disp_addr = safe_str(row.get('SOLDADD1'))
                if row.get('SoldAdd2'): disp_addr += " " + safe_str(row.get('SoldAdd2'))
                
                # Full names
                acq_name = f"{safe_str(row.get('BUYFNAME')) or ''} {safe_str(row.get('BUYMNAME')) or ''} {safe_str(row.get('BUYLNAME')) or ''}".strip()
                disp_name = f"{safe_str(row.get('SOLDFNAME')) or ''} {safe_str(row.get('SOLDMNAME')) or ''} {safe_str(row.get('SOLDLNAME')) or ''}".strip()
                
                batch_data.append((
                    gunlog_id,
                    int(row.get('GunLogNum', 0)),
                    inventory_item_id,
                    safe_str(row.get('MANUFACTUR')) or 'Unknown',
                    safe_str(row.get('IMPORTER')),
                    safe_str(row.get('MODEL')) or 'Unknown',
                    safe_str(row.get('SERIAL')) or 'Unknown',
                    safe_str(row.get('CALIBER')) or 'Unknown',
                    safe_str(row.get('GUNTYPE')) or 'Unknown',
                    safe_str(row.get('ACTION')) or 'Unknown',
                    
                    # Acquisition
                    row.get('BUYDATE'),
                    acquisition_customer_id,
                    acq_name or 'Unknown',
                    acq_addr,
                    safe_str(row.get('BUYCITY')),
                    safe_str(row.get('BUYSTATE')),
                    safe_str(row.get('BUYZIP')),
                    safe_str(row.get('BUYIDTYPE')), # license type
                    safe_str(row.get('BUYIDNUM')),  # license number
                    
                    # Disposition
                    row.get('SOLDDATE'),
                    disposition_customer_id,
                    disp_name,
                    disp_addr,
                    safe_str(row.get('SOLDCITY')),
                    safe_str(row.get('SOLDSTATE')),
                    safe_str(row.get('SOLDZIP')),
                    safe_str(row.get('SOLDIDTYPE')),
                    safe_str(row.get('SOLDIDNUM')),
                    
                    safe_str(row.get('NICSTN')) # NICS/Notes? Put in notes or separate column if exists?
                    # The schema has specific columns. Let's match insert statement.
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
                    print(f"  Error processing gun log {row.get('GunLogNum')}: {e}")
        
        # Insert remaining
        if batch_data:
            try:
                _insert_batch(pg_cursor, batch_data)
                pg_conn.commit()
            except Exception as e:
                pg_conn.rollback()
                errors += len(batch_data)
                print(f"  Final batch error: {e}")
        
        print(f"\n✅ Gun Log Migration Completed!")
        print(f"   Migrated: {len(records) - errors}")
        print(f"   Errors: {errors}")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _insert_batch(cursor, data):
    sql = """
        INSERT INTO gunlog (
            id, gunlog_number, inventory_item_id,
            manufacturer, importer, model, serial_number, caliber_gauge, firearm_type, firearm_action,
            acquisition_date, acquisition_customer_id, acq_name_full, acq_addr1, acq_city, acq_state, acq_zip, acq_id_type, acq_id_number,
            disposition_date, disposition_customer_id, disp_name_full, disp_addr1, disp_city, disp_state, disp_zip, disp_id_type, disp_id_number,
            notes
        ) VALUES %s
        ON CONFLICT (id) DO NOTHING
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_gunlog()
