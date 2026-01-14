import pymssql
import psycopg2
import re
import uuid
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def sanitize_code(text):
    """Sanitize text for ltree compatibility - only alphanumeric and underscore"""
    if not text:
        return "UNK"
    # Take first 3 chars, upper case, remove non-alnum
    clean = re.sub(r'[^A-Z0-9]', '', text.upper())
    return clean[:3] if clean else "UNK"

def generate_unique_code(base_name, existing_codes, id_suffix=None):
    """
    Generate a unique code based on name.
    1. Try first 3 letters (sanitized).
    2. If taken, try appending suffix (first 4 chars of UUID or ID).
    3. If still taken, keep appending random hex helpers until unique.
    """
    base_code = sanitize_code(base_name)
    
    if base_code not in existing_codes:
        existing_codes.add(base_code)
        return base_code
        
    # Collision happened
    # Try using provided suffix (e.g. from ID)
    if id_suffix:
        candidate = f"{base_code}_{id_suffix[:4].upper()}"
        if candidate not in existing_codes:
            existing_codes.add(candidate)
            return candidate
            
    # Fallback to random suffix
    while True:
        suffix = uuid.uuid4().hex[:4].upper()
        candidate = f"{base_code}_{suffix}"
        if candidate not in existing_codes:
            existing_codes.add(candidate)
            return candidate

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
        
        # Track used codes to prevent UniqueViolation
        # We need separate sets for different scopes if unique constraints are scoped.
        # Category codes are unique globally in inventory_category.
        # Subcategory codes are unique globally in inventory_subcategory (usually).
        # Brand codes are unique per Category in inventory_brand (compound).
        
        cat_codes = set()
        subcat_codes = set()
        
        # Pre-populate existing codes from PG to avoid collisions with existing data
        pg_cursor.execute("SELECT code FROM inventory_category")
        for r in pg_cursor.fetchall():
            if r[0]: cat_codes.add(r[0])
            
        pg_cursor.execute("SELECT code FROM inventory_subcategory")
        for r in pg_cursor.fetchall():
            if r[0]: subcat_codes.add(r[0])

        # ==========================================
        # PHASE 1: Categories (Level 1) -> inventory_category
        # ==========================================
        print("\n📂 Phase 1: Migrating Categories (Level 1)...")
        mssql_cursor.execute("SELECT * FROM dbo.Level1 ORDER BY lv1_pk")
        rows = mssql_cursor.fetchall()
        
        print(f"  Found {len(rows)} categories in Level1")
        inserted = 0
        errors = 0
        
        for row in tqdm(rows, desc="Migrating categories"):
            try:
                l1_pk = row['lv1_pk']
                cat_id = str(row['lv1_ID']) # Use existing UUID if possible
                name = (row['DESCRIPT'] or 'Unknown').strip()
                
                # Proactively generate unique code
                code = generate_unique_code(name, cat_codes, id_suffix=str(l1_pk))
                
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
                pg_conn.commit()  # Commit per row
                
            except Exception as e:
                pg_conn.rollback() # Rollback on error
                errors += 1
                print(f"\n  ❌ Error inserting Category {l1_pk} '{name}': {e}")
        
        print(f"  ✅ Migrated {inserted} Categories (Errors: {errors})")
        print(f"  Category Map Size: {len(l1_map)}")

        # ==========================================
        # PHASE 2: Subcategories (Level 2) -> inventory_subcategory
        # ==========================================
        print("\n📂 Phase 2: Migrating Subcategories (Level 2)...")
        mssql_cursor.execute("SELECT * FROM dbo.Level2")
        rows = mssql_cursor.fetchall()
        
        inserted = 0
        skipped = 0
        
        for row in tqdm(rows, desc="Migrating subcategories"):
            try:
                l2_pk = row['lv2_pk']
                l1_fk_int = row['lv1_Parent'] # Integer FK to Level 1
                
                # Get Parent Category UUID
                parent_uuid = l1_map.get(l1_fk_int)
                if not parent_uuid:
                    skipped += 1
                    continue
                
                sub_id = str(row['lv2_ID'])
                name = (row['Descript'] or 'Unknown').strip()
                
                # Proactively generate unique code
                code = generate_unique_code(name, subcat_codes, id_suffix=str(l2_pk))
                
                pg_cursor.execute("""
                    INSERT INTO inventory_subcategory (id, inventory_category_id, name, code, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        inventory_category_id = EXCLUDED.inventory_category_id,
                        code = EXCLUDED.code
                """, (sub_id, parent_uuid, name, code, True))
                
                l2_map[l2_pk] = sub_id
                inserted += 1
                pg_conn.commit() # Commit per row
                
            except Exception as e:
                pg_conn.rollback() # Rollback on error
                print(f"  ❌ Error inserting Subcategory {name}: {e}")
                
        print(f"  Migrated {inserted} Subcategories (Skipped: {skipped})")

        # ==========================================
        # PHASE 3: Brands (Level 5) -> inventory_brand
        # ==========================================
        print("\n📂 Phase 3: Migrating Brands (Level 5)...")
        
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
        # Determine brand code uniqueness scope: (inventory_category_id, code)
        brand_codes_map = {} 
        
        # Pre-populate brand codes
        pg_cursor.execute("SELECT inventory_category_id, code FROM inventory_brand")
        for r in pg_cursor.fetchall():
            if r[0]:
                c_uuid = str(r[0])
                b_code = r[1]
                if c_uuid not in brand_codes_map:
                    brand_codes_map[c_uuid] = set()
                if b_code:
                    brand_codes_map[c_uuid].add(b_code)

        for row in tqdm(rows, desc="Migrating brands"):
            try:
                l1_fk = row['LEVEL1_FK']
                brand_name = (row['BrandName'] or 'Unknown').strip()
                
                # Parent Category
                cat_uuid = l1_map.get(l1_fk)
                if not cat_uuid:
                    continue
                
                # Initialize code set for this category if needed
                if cat_uuid not in brand_codes_map:
                    brand_codes_map[cat_uuid] = set()
                    
                # Generate unique code local to category
                code = generate_unique_code(brand_name, brand_codes_map[cat_uuid], id_suffix=str(row['lv5_PK']))
                
                # Always generate new ID because one Brand can be split into multiple Categories
                brand_uuid = str(uuid.uuid4())
                
                pg_cursor.execute("""
                    INSERT INTO inventory_brand (id, inventory_category_id, name, code, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (inventory_category_id, code) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                """, (brand_uuid, cat_uuid, brand_name, code, True))
                
                if pg_cursor.rowcount > 0:
                    inserted += 1
                
                pg_conn.commit() # Commit per row
                    
            except Exception as e:
                pg_conn.rollback() # Rollback on error
                print(f"  ❌ Error inserting Brand {brand_name}: {e}")

        print(f"  Migrated {inserted} Brands")
        print("✅ Category/Subcategory/Brand Migration Completed!")

    except Exception as e:
        if 'pg_conn' in locals(): pg_conn.rollback()
        print(f"❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

if __name__ == "__main__":
    migrate_categories()
