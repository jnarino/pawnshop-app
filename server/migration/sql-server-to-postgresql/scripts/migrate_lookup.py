import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG, LOOKUP_MAPPING

def safe_str(value):
    """Safely convert value to string, strip whitespace and NUL bytes"""
    if value is None:
        return None
    return str(value).replace('\x00', '').strip() if value else None

def migrate_lookup():
    print("🚀 Starting Lookup_C Migration...")
    
    # Connect to databases
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # 1. Migrate Lookup_B -> item_attribute_type
        print("Migrating Lookup_B to item_attribute_type...")
        mssql_cursor.execute("SELECT * FROM Lookup_B")
        groups = mssql_cursor.fetchall()
        
        # Map lb_pk to type_id for later use
        group_map = {} # lb_pk -> uuid
        
        for row in groups:
            lb_pk = row['lb_pk']
            name = safe_str(row['lb_descript'])
            if not name: continue
            
            # Check if exists or insert
            pg_cursor.execute("SELECT id FROM item_attribute_type WHERE name = %s", (name,))
            res = pg_cursor.fetchone()
            if res:
                type_id = res[0]
            else:
                type_id = str(uuid.uuid4())
                pg_cursor.execute("""
                    INSERT INTO item_attribute_type (id, name) VALUES (%s, %s)
                """, (type_id, name))
            
            group_map[lb_pk] = type_id
            
        pg_conn.commit()
        print(f"Migrated {len(group_map)} attribute types")
        
        # 2. Migrate Lookup_C -> item_attribute_value
        print("Migrating Lookup_C to item_attribute_value...")
        mssql_cursor.execute("SELECT * FROM Lookup_C")
        values = mssql_cursor.fetchall()
        
        value_count = 0
        # Map lc_pk to both value text and UUID
        # This is needed because color field needs the UUID reference
        lookup_value_map = {}  # lc_pk -> {"value": text, "id": uuid}
        
        for row in values:
            lb_fk = row['LB_FK']
            lc_pk = row['lc_pk']
            val_text = safe_str(row['lc_Descript'])
            
            if not val_text or lb_fk not in group_map:
                continue
                
            type_id = group_map[lb_fk]
            
            # Insert into item_attribute_value and get the ID
            pg_cursor.execute("""
                INSERT INTO item_attribute_value (attribute_type_id, value)
                VALUES (%s, %s)
                ON CONFLICT (attribute_type_id, value) DO UPDATE SET value = EXCLUDED.value
                RETURNING id
            """, (type_id, val_text))
            
            value_id = pg_cursor.fetchone()[0]
            lookup_value_map[lc_pk] = {"value": val_text, "id": str(value_id)}
            value_count += 1
            
        pg_conn.commit()
        print(f"Migrated {value_count} attribute values")
        
        # Save map for inventory migration
        # We need:
        # 1. Map of lc_pk -> {value, id} (for color field UUID reference)
        # 2. Map of lb_pk -> attribute name (to know what key to use in JSON)
        # 3. Map of attribute type name -> type_id (to find COLOR type)
        
        # Reverse group map to get names and IDs
        group_name_map = {}
        type_name_to_id = {}
        for row in groups:
            if row['lb_pk'] in group_map:
                name = safe_str(row['lb_descript'])
                group_name_map[row['lb_pk']] = name
                type_name_to_id[name] = group_map[row['lb_pk']]

        final_map = {
            "values": lookup_value_map,
            "types": group_name_map,
            "type_ids": type_name_to_id
        }
        
        with open('lookup_map.json', 'w') as f:
            json.dump(final_map, f, indent=2)
            
        print("✅ Lookup Migration Completed")
        
    except Exception as e:
        print(f"❌ Migration Failed: {e}")
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

if __name__ == "__main__":
    migrate_lookup()
