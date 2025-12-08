import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    """Safely convert value to string, strip whitespace and NUL bytes"""
    if value is None:
        return None
    # Convert to string, remove NUL bytes, then strip whitespace
    return str(value).replace('\x00', '').strip() if value else None

def migrate_inventory():
    print("🚀 Starting Inventory Migration...")
    
    # Load Lookup Map
    try:
        with open('lookup_map.json', 'r') as f:
            lookup_map = json.load(f)
    except FileNotFoundError:
        print("❌ lookup_map.json not found. Run migrate_lookup.py first.")
        return
    
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Get or create Unknown category for orphaned items
        pg_cursor.execute("SELECT id FROM inventory_category WHERE code = 'UNKNOWN'")
        unknown_cat = pg_cursor.fetchone()
        if not unknown_cat:
            import uuid as uuid_lib
            unknown_id = str(uuid_lib.uuid4())
            pg_cursor.execute("""
                INSERT INTO inventory_category (id, name, code, parent_id)
                VALUES (%s, 'Unknown/Uncategorized', 'UNKNOWN', NULL)
                RETURNING id
            """, (unknown_id,))
            unknown_cat_id = pg_cursor.fetchone()[0]
            pg_conn.commit()
        else:
            unknown_cat_id = str(unknown_cat[0])
        
        print(f"Using fallback category: {unknown_cat_id}")
        
        # Fetch inventory items
        print("Fetching inventory items from SQL Server...")
        mssql_cursor.execute("""
            SELECT * FROM dbo.items 
            WHERE DateItemEntered > '1980-01-01'
            ORDER BY DateItemEntered
        """)
        
        items = mssql_cursor.fetchall()
        print(f"Found {len(items)} items to migrate")
        
        # Fetch Details (Jewelry & Guns) and Stones into memory maps for speed
        print("Fetching Jewelry Details...")
        mssql_cursor.execute("SELECT * FROM Detail_J")
        jewelry_details = {row['Items_FK']: row for row in mssql_cursor.fetchall()}
        
        print("Fetching Gun Details...")
        mssql_cursor.execute("SELECT * FROM Detail_G")
        gun_details = {row['Items_FK']: row for row in mssql_cursor.fetchall()}
        
        print("Fetching Stones...")
        mssql_cursor.execute("SELECT * FROM dbo.stones")
        stones_rows = mssql_cursor.fetchall()
        # Group stones by JDT_FK (Jewelry Detail FK)
        stones_map = {}
        for row in stones_rows:
            jdt_fk = row['JDT_FK']
            if jdt_fk not in stones_map:
                stones_map[jdt_fk] = []
            stones_map[jdt_fk].append(row)
        
        # Helper to get lookup value
        lookup_values = lookup_map.get('values', {})
        def get_val(lc_pk):
            return lookup_values.get(str(lc_pk))
        
        batch_size = 1000
        batch_data = []
        errors = 0
        
        print("Migrating...")
        for row in tqdm(items):
            try:
                item_pk = row['ITEMS_PK']
                
                # Use source UUID if available, otherwise generate
                item_id = str(row['Items_ID']) if row.get('Items_ID') else str(uuid.uuid4())
                
                # Category: Use most specific level available (5 > 4 > 3 > 2 > 1)
                category_id = None
                for level_col in ['lv5_ID', 'lv4_ID', 'lv3_ID', 'lv2_ID', 'lv1_ID']:
                    if row.get(level_col):
                        potential_cat_id = str(row[level_col])
                        # Verify category exists in PostgreSQL
                        pg_cursor.execute("SELECT 1 FROM inventory_category WHERE id = %s", (potential_cat_id,))
                        if pg_cursor.fetchone():
                            category_id = potential_cat_id
                            break
                
                # Use fallback if no valid category found
                if not category_id: category_id = unknown_cat_id
                
                # Color removed - now stored in attributes JSONB
                
                # Attributes & Extra
                attributes = {}
                extra = {}
                
                # Jewelry Attributes
                if item_pk in jewelry_details:
                    jd = jewelry_details[item_pk]
                    if jd.get('Metal_FK'): attributes['Metal'] = get_val(jd['Metal_FK'])
                    if jd.get('Karat_FK'): attributes['Karat'] = get_val(jd['Karat_FK'])
                    if jd.get('Gender_FK'): attributes['Gender'] = get_val(jd['Gender_FK'])
                    if jd.get('Style_FK'): attributes['Style'] = get_val(jd['Style_FK'])
                    if jd.get('Sizelen_FK'): attributes['Size'] = get_val(jd['Sizelen_FK']) # Or is it a value?
                    if jd.get('Weight'): attributes['Weight'] = float(jd['Weight'])
                    
                    # Stones
                    jdt_pk = jd['JDT_PK']
                    if jdt_pk in stones_map:
                        stones_list = []
                        for s in stones_map[jdt_pk]:
                            stone_data = {
                                "type": get_val(s.get('TYPSTONEFK')),
                                "shape": get_val(s.get('SHAPE_FK')),
                                "color": get_val(s.get('COLOR_FK')),
                                "clarity": get_val(s.get('TRANSLUCFK')),
                                "quantity": int(s.get('NUMSTONE') or 0),
                                "weight": float(s.get('WEIGHT') or 0),
                                "carat": float(s.get('CARAT') or 0)
                            }
                            # Remove None values
                            stones_list.append({k: v for k, v in stone_data.items() if v is not None})
                        extra['stones'] = stones_list

                # Gun Attributes
                if item_pk in gun_details:
                    gd = gun_details[item_pk]
                    if gd.get('Action_FK'): attributes['Action'] = get_val(gd['Action_FK'])
                    if gd.get('Caliber_FK'): attributes['Caliber'] = get_val(gd['Caliber_FK'])
                    if gd.get('Finish_FK'): attributes['Finish'] = get_val(gd['Finish_FK'])
                    if gd.get('Barrel_FK'): attributes['Barrel'] = get_val(gd['Barrel_FK'])
                    if gd.get('ImporterFK'): attributes['Importer'] = get_val(gd['ImporterFK'])
                    if gd.get('Condition'): attributes['Condition'] = safe_str(gd['Condition'])

                # Construct Batch
                batch_data.append((
                    str(row['Items_ID']) if row.get('Items_ID') else str(uuid.uuid4()),
                    category_id,
                    'I', # Status (Default to Inventory, logic can be improved)
                    safe_str(row.get('MODELNUM')), # Model
                    safe_str(row.get('SERIALNUM')), # Serial
                    safe_str(row.get('Condition')), # Condition
                    max(int(row.get('OnHand', 1)), 1), # Quantity
                    row.get('AMOUNT'), # Price/Pawn Amount?
                    row.get('RESALEAMT'), # Resale
                    row.get('INSREPCOST'), # Replace
                    safe_str(row.get('OWNERNUM')), # Owner
                    safe_str(row.get('DESCRIPT')), # Description
                    json.dumps(extra),
                    json.dumps(attributes),
                    safe_str(row.get('INVNUM')), # Inventory Number
                    safe_str(row.get('BIN')), # Bin Location
                    row.get('storagefee') # Storage Fee
                ))
                
                if len(batch_data) >= batch_size:
                    _insert_batch(pg_cursor, batch_data)
                    pg_conn.commit()
                    batch_data = []
                    
            except Exception as e:
                errors += 1
                if errors < 10:
                    print(f"  Error processing item {row.get('ITEMS_PK')}: {e}")

        if batch_data:
            _insert_batch(pg_cursor, batch_data)
            pg_conn.commit()
            
        print(f"✅ Inventory Migration Completed! Errors: {errors}")
        
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
        INSERT INTO inventory_item (
            id, category_id, status, 
            model, serial_number, item_condition, 
            quantity, price_amount, resale, item_replace, owner_mark, 
            item_description, extra, attributes, inventory_number,
            bin_location, storage_fee
        ) VALUES %s
        ON CONFLICT (id) DO NOTHING
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_inventory()
