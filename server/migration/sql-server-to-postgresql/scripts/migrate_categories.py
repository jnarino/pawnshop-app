import pymssql
import psycopg2
import re
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def sanitize_code(text):
    """Sanitize text for ltree compatibility - only alphanumeric and underscore"""
    if not text:
        return "UNNAMED"
    # Replace special chars with underscore, remove consecutive underscores
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', text.upper())
    sanitized = re.sub(r'_+', '_', sanitized)
    return sanitized.strip('_')[:50] or "UNNAMED"

def migrate_categories():
    print("🚀 Starting Category Migration...")
    
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Levels to migrate
        levels = [
            {'table': 'dbo.Level1', 'pk': 'lv1_ID', 'name_col': 'DESCRIPT', 'parent_uuid_col': None},
            {'table': 'dbo.Level2', 'pk': 'lv2_ID', 'name_col': 'Descript', 'parent_uuid_col': 'lv1_ID'},
            {'table': 'dbo.Level3', 'pk': 'lv3_ID', 'name_col': 'Descript', 'parent_uuid_col': 'lv2_ID'},
            {'table': 'dbo.Level4', 'pk': 'lv4_ID', 'name_col': 'Descript', 'parent_uuid_col': 'lv3_ID'},
            {'table': 'dbo.Level5', 'pk': 'lv5_ID', 'name_col': 'Descript', 'parent_uuid_col': 'lv4_ID'},
        ]
        
        for i, level in enumerate(levels):
            level_num = i + 1
            print(f"\nProcessing Level {level_num} ({level['table']})...")
            
            # Check if table exists
            try:
                mssql_cursor.execute(f"SELECT TOP 1 * FROM {level['table']}")
            except:
                print(f"  Table {level['table']} not found, skipping.")
                continue
                
            # Fetch data
            mssql_cursor.execute(f"SELECT * FROM {level['table']}")
            rows = mssql_cursor.fetchall()
            print(f"  Found {len(rows)} categories")
            
            inserted = 0
            for row in rows:
                cat_id = str(row[level['pk']])
                
                # Handle column name variations
                name_col = level['name_col']
                if name_col not in row:
                    # Try alternative column names
                    for alt in ['DESCRIPT', 'Descript', 'descript', 'NAME', 'Name']:
                        if alt in row:
                            name_col = alt
                            break
                    else:
                        print(f"  Warning: No name column found for {level['table']}, using default")
                        name = f"Unnamed L{level_num}"
                        
                if name_col in row:
                    name = (row[name_col] or '').strip()
                    if not name: name = f"Unnamed L{level_num}"
                
                # Generate Code (Sanitized for ltree)
                code = sanitize_code(name)
                
                parent_id = None
                if level['parent_uuid_col']:
                    if level['parent_uuid_col'] in row:
                        parent_id = str(row[level['parent_uuid_col']])
                    else:
                        print(f"  Warning: Parent column {level['parent_uuid_col']} not found")

                    
                try:
                    pg_cursor.execute("""
                        INSERT INTO inventory_category (id, name, code, parent_id)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET 
                            name = EXCLUDED.name,
                            code = EXCLUDED.code,
                            parent_id = EXCLUDED.parent_id
                    """, (cat_id, name, code, parent_id))
                    inserted += 1
                except psycopg2.errors.ForeignKeyViolation:
                    pg_conn.rollback()
                    print(f"  Skipping {name} (ID: {cat_id}): Parent {parent_id} not found")
                except psycopg2.errors.UniqueViolation:
                    pg_conn.rollback()
                    # Try with unique code (append UUID prefix)
                    code = f"{sanitize_code(name)[:45]}_{cat_id[:4]}"
                    try:
                        pg_cursor.execute("""
                            INSERT INTO inventory_category (id, name, code, parent_id)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
                        """, (cat_id, name, code, parent_id))
                        pg_conn.commit()
                        inserted += 1
                    except Exception as e2:
                        pg_conn.rollback()
                        print(f"  Error inserting {name}: {e2}")
                except Exception as e:
                    pg_conn.rollback()
                    print(f"  Error inserting {name}: {e}")
                else:
                    pg_conn.commit()
                    
            print(f"  Migrated {inserted} categories for Level {level_num}")
            
        print("\n✅ Category Migration Completed!")
        
    except Exception as e:
        print(f"❌ Migration Failed: {e}")
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

if __name__ == "__main__":
    migrate_categories()
