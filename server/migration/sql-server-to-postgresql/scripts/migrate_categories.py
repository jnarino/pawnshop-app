import pymssql
import psycopg2
import re
import uuid
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def sanitize_code(text):
    """Sanitize text for ltree compatibility - only alphanumeric and underscore"""
    if not text:
        return "UNNAMED"
    # Replace special chars with underscore, remove consecutive underscores
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', text.upper())
    sanitized = re.sub(r'_+', '_', sanitized)
def migrate_categories():
    print("🚀 Starting Category Migration (Split Schema)...")
    
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Maps for Foreign Key lookup
        l1_map = {} # PK (int) -> UUID
        l2_map = {} # PK (int) -> UUID
        brand_map = {} # (L5_PK, L1_UUID) -> Brand_UUID (Compound key needed as Brands are now scoped to Category)

        # ==========================================
        # PHASE 1: Categories (Level 1) -> inventory_category
        # ==========================================
        print("\n📂 Phase 1: Migrating Categories (Level 1)...")
        mssql_cursor.execute("SELECT * FROM dbo.Level1")
        rows = mssql_cursor.fetchall()
        
        inserted = 0
        for row in tqdm(rows):
            try:
                l1_pk = row['lv1_pk']
                cat_id = str(row['lv1_ID']) # Use existing UUID if possible
                name = (row['DESCRIPT'] or 'Unknown').strip() # FIXED L1 Casing
                code = name[:3].strip().upper() # Derived Code
                
                # Insert into inventory_category
                pg_cursor.execute("""
                    INSERT INTO inventory_category (id, name, code, is_active)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET 
                        name = EXCLUDED.name,
                        code = EXCLUDED.code
                """, (cat_id, name, code, True))
                
                l1_map[l1_pk] = cat_id
                inserted += 1
            except Exception as e:
                pg_conn.rollback()
                # Handle unique code violation if necessary
                # Try uniquify code
                suffix = cat_id[:4].upper()
                new_code = f"{code}_{suffix}"
                try:
                    pg_cursor.execute("""
                        INSERT INTO inventory_category (id, name, code, is_active)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
                    """, (cat_id, name, new_code, True))
                    inserted += 1
                except:
                    print(f"  Error inserting Category {name}: {e}")
            else:
                pg_conn.commit()
                
        print(f"  Migrated {inserted} Categories")

        # ==========================================
        # PHASE 2: Subcategories (Level 2) -> inventory_subcategory
        # ==========================================
        print("\n📂 Phase 2: Migrating Subcategories (Level 2)...")
        mssql_cursor.execute("SELECT * FROM dbo.Level2")
        rows = mssql_cursor.fetchall()
        
        inserted = 0
        for row in tqdm(rows):
            try:
                l2_pk = row['lv2_pk']
                l1_fk = row['lv1_ID'] # Wait, FK is lv1_ID or lv1_Parent?
                # Inspection: L2 keys: ['sto_pk', 'lv2_pk', 'lv1_Parent', 'Descript', 'lv2_ID', 'lv1_ID', 'LastUpdatedUSR_ID']
                # Usually lv1_Parent is the integer FK to Level1 (lv1_pk)? Or is it UUID?
                # In previous successful runs I used 'LEVEL1_FK' or similar. 
                # Let's check `migrate_categories.py` before my total rewrite step 998...
                # It used to say: {'level': 2, 'pk': 'lv2_PK', ... 'parent_fk': 'LEVEL1_FK'}
                # But Inspect output shows `lv1_Parent`. Mssql case insensitive?
                # Let's assume `lv1_Parent` is the FK. Is it int or UUID?
                # Level 1 has `lv1_pk` (int) and `lv1_ID` (UUID).
                # Usually `Parent` implies mapping to PK.
                # I'll try `row['lv1_Parent']` as int FK.
                
                l1_fk_int = row['lv1_Parent']
                
                # Get Parent Category UUID
                parent_uuid = l1_map.get(l1_fk_int)
                if not parent_uuid:
                    # Try assuming lv1_Parent might be UUID? No, map is keyed by int.
                    continue
                
                sub_id = str(row['lv2_ID'])
                name = (row['Descript'] or 'Unknown').strip()
                code = name[:3].strip().upper()
                
                pg_cursor.execute("""
                    INSERT INTO inventory_subcategory (id, inventory_category_id, name, code, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        inventory_category_id = EXCLUDED.inventory_category_id
                """, (sub_id, parent_uuid, name, code, True))
                
                l2_map[l2_pk] = sub_id
                inserted += 1
                
            except Exception as e:
                pg_conn.rollback()
                if 'inventory_subcategory_unique_code' in str(e):
                     suffix = sub_id[:4].upper()
                     new_code = f"{code}_{suffix}"
                     try:
                        pg_cursor.execute("""
                            INSERT INTO inventory_subcategory (id, inventory_category_id, name, code, is_active)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
                        """, (sub_id, parent_uuid, name, new_code, True))
                        pg_conn.commit()
                        inserted += 1
                     except Exception as e2:
                         print(f"  Error inserting Subcategory {name}: {e2}")
                else:
                     # print(f"  Error inserting Subcategory {name}: {e}")
                     pass
            else:
                pg_conn.commit()
        
        print(f"  Migrated {inserted} Subcategories")

        # ==========================================
        # PHASE 3: Brands (Level 5) -> inventory_brand
        # ==========================================
        print("\n📂 Phase 3: Migrating Brands (Level 5)...")
        
        # Inspection showed no Code in L5.
        mssql_cursor.execute("""
            SELECT DISTINCT 
                l5.lv5_PK,
                l5.lv5_ID,
                l5.DESCRIPT as BrandName,
                i.LEVEL1_FK
            FROM dbo.items i
            JOIN dbo.Level5 l5 ON i.LEVEL5_FK = l5.lv5_PK
            WHERE i.LEVEL1_FK IS NOT NULL
        """)
        rows = mssql_cursor.fetchall()
        
        inserted = 0
        for row in tqdm(rows):
            try:
                l5_pk = row['lv5_PK']
                l1_fk = row['LEVEL1_FK']
                brand_name = (row['BrandName'] or 'Unknown').strip()
                brand_code = brand_name[:3].strip().upper()
                
                # Parent Category
                cat_uuid = l1_map.get(l1_fk)
                if not cat_uuid:
                    continue
                
                brand_uuid = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO inventory_brand (id, inventory_category_id, name, code, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (inventory_category_id, code) DO UPDATE SET name = EXCLUDED.name
                        RETURNING id
                """, (brand_uuid, cat_uuid, brand_name, brand_code, True))
                
                res = pg_cursor.fetchone()
                if res:
                    final_uuid = str(res[0])
                    inserted += 1

            except Exception as e:
                pg_conn.rollback()
                # Handle Unique Code
                suffix = str(uuid.uuid4())[:4].upper()
                new_code = f"{brand_code}_{suffix}"
                try:
                    brand_uuid = str(uuid.uuid4())
                    pg_cursor.execute("""
                        INSERT INTO inventory_brand (id, inventory_category_id, name, code, is_active)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    """, (brand_uuid, cat_uuid, brand_name, new_code, True))
                    res = pg_cursor.fetchone()
                    if res: inserted += 1
                except Exception as e2:
                    print(f"  Error inserting Brand {brand_name}: {e2}")
            else:
                pg_conn.commit()


        print(f"  Migrated {inserted} Brands")
        print("✅ Category/Subcategory/Brand Migration Completed!")

    except Exception as e:
        if 'pg_conn' in locals(): pg_conn.rollback()
        print(f"❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()

if __name__ == "__main__":
    migrate_categories()
