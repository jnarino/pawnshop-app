import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
from datetime import datetime
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    """Safely convert value to string, strip whitespace and NUL bytes"""
    if value is None:
        return None
    # Convert to string, remove NUL bytes, then strip whitespace
    return str(value).replace('\x00', '').strip() if value else None

def parse_composit3_jewelry(composit3_str, attr_lookup):
    """
    Parse Composit3 field for JEWELRY and return dict of attribute IDs
    Format: METAL;METAL;CODE;KARAT;KARAT;KARAT;GENDER;GENDER;CODE;STYLE;STYLE;CODE;SIZE;SIZE;SIZE;WEIGHT UNIT;
    Example: WHITE GOLD;WHITE GOLD;W;14KT;14KT;14KT;WOMAN'S;WOMAN'S;W;ENGAGEMENT RING;ENGAGEMENT RING;X;5 3/4;5 3/4;5 3/4;5.80 GRM;
    """
    if not composit3_str:
        return {}
        
    parts = composit3_str.split(';')
    if len(parts) < 16:
        return {}  # Not enough parts
        
    result = {}
    
    try:
        # Metal (positions 0-2, use first non-empty)
        metal_val = (parts[0] or parts[1] or '').strip().upper()
        if metal_val and 'METAL' in attr_lookup:
            metal_id = attr_lookup['METAL'].get(metal_val)
            if metal_id:
                result['metal'] = metal_id
        
        # Karat (positions 3-5, use first non-empty)
        karat_val = (parts[3] or parts[4] or parts[5] or '').strip().upper()
        if karat_val and 'KARAT' in attr_lookup:
            karat_id = attr_lookup['KARAT'].get(karat_val)
            if karat_id:
                result['karat'] = karat_id
        
        # Gender (positions 6-8, use first non-empty)
        gender_val = (parts[6] or parts[7] or '').strip().upper()
        if gender_val and 'GENDER' in attr_lookup:
            gender_id = attr_lookup['GENDER'].get(gender_val)
            if gender_id:
                result['gender'] = gender_id
        
        # Style (positions 9-11, use first non-empty)
        style_val = (parts[9] or parts[10] or '').strip().upper()
        if style_val and 'STYLE' in attr_lookup:
            style_id = attr_lookup['STYLE'].get(style_val)
            if style_id:
                result['style'] = style_id
        
        # Size/Length (positions 12-14, use first non-empty)
        size_val = (parts[12] or parts[13] or parts[14] or '').strip()
        if size_val and 'SIZE/LENGTH' in attr_lookup:
            size_id = attr_lookup['SIZE/LENGTH'].get(size_val.upper())
            if size_id:
                result['sizeLength'] = size_id
        
        # Weight (position 15, format: "5.80 GRM")
        if len(parts) > 15 and parts[15]:
            weight_str = parts[15].strip()
            # Extract numeric part
            import re
            weight_match = re.search(r'([\d.]+)\s*(\w+)?', weight_str)
            if weight_match:
                weight_num = weight_match.group(1)
                weight_unit = weight_match.group(2) or 'GRM'
                result['weight'] = weight_num
                result['weightUnit'] = weight_unit
                
    except (IndexError, ValueError) as e:
        # Silently ignore parsing errors for individual items
        pass
        
    return result

def parse_composit3_firearm(composit3_str, attr_lookup):
    """
    Parse Composit3 field for FIREARMS and return dict of attribute IDs
    Format: ACTION;ACTION;CODE;CALIBER;CALIBER;CALIBER;COLOR;COLOR;CODE;BARREL;BARREL;CODE;IMPORTER;IMPORTER;IMPORTER;BARREL_LENGTH;CONDITION;
    Example: SEMI-AUTO;SEMI-AUTO;SEMI-AUTO;9 MM;9 MM;9 MM;BLACK;BLACK;X;SINGLE BARREL;SINGLE BARREL;1;USA;USA;USA;3.7";USED;
    """
    if not composit3_str:
        return {}
        
    parts = composit3_str.split(';')
    if len(parts) < 15:
        return {}  # Not enough parts
        
    result = {}
    
    try:
        # Action (positions 0-2, use first non-empty)
        action_val = (parts[0] or parts[1] or parts[2] or '').strip().upper()
        if action_val and 'ACTION' in attr_lookup:
            action_id = attr_lookup['ACTION'].get(action_val)
            if action_id:
                result['action'] = action_id
        
        # Caliber (positions 3-5, use first non-empty)
        caliber_val = (parts[3] or parts[4] or parts[5] or '').strip().upper()
        if caliber_val and 'CALIBER' in attr_lookup:
            caliber_id = attr_lookup['CALIBER'].get(caliber_val)
            if caliber_id:
                result['caliber'] = caliber_id
        
        # Finish (positions 6-8, use first non-empty)
        finish_val = (parts[6] or parts[7] or '').strip().upper()
        if finish_val and 'FINISH' in attr_lookup:
            finish_id = attr_lookup['FINISH'].get(finish_val)
            if finish_id:
                result['finish'] = finish_id
        
        # Barrel (positions 9-11, use first non-empty)
        barrel_val = (parts[9] or parts[10] or '').strip().upper()
        if barrel_val and 'BARREL' in attr_lookup:
            barrel_id = attr_lookup['BARREL'].get(barrel_val)
            if barrel_id:
                result['barrel'] = barrel_id
        
        # Importer (positions 12-14, use first non-empty)
        importer_val = (parts[12] or parts[13] or parts[14] or '').strip().upper()
        if importer_val and 'IMPORTER' in attr_lookup:
            importer_id = attr_lookup['IMPORTER'].get(importer_val)
            if importer_id:
                result['importer'] = importer_id
        
        # Barrel Length (position 15, format: 3.7")
        if len(parts) > 15 and parts[15]:
            barrel_length_str = parts[15].strip()
            # Extract numeric part
            import re
            length_match = re.search(r'([\d.]+)', barrel_length_str)
            if length_match:
                result['barrelLength'] = length_match.group(1)
        
        # Condition (position 16)
        if len(parts) > 16 and parts[16]:
            condition_val = parts[16].strip().upper()
            if condition_val and 'CONDITION' in attr_lookup:
                condition_id = attr_lookup['CONDITION'].get(condition_val)
                if condition_id:
                    result['condition'] = condition_id
                
    except (IndexError, ValueError) as e:
        # Silently ignore parsing errors for individual items
        pass
        
    return result

def migrate_inventory():
    print("🚀 Starting Inventory Migration (Split Schema: Subcategory + Brand)...")
    
    # Load User Map
    try:
        with open('user_map.json', 'r') as f:
            user_map = json.load(f)
    except:
        print("⚠️ user_map.json not found. owner_id will be null.")
        user_map = {}

    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # ==================================
        # 1. Build Lookup Maps
        # ==================================
        print("Building Lookup Maps...")
        
        # L1 Map: PK -> UUID
        l1_map = {}
        mssql_cursor.execute("SELECT lv1_pk, lv1_ID FROM dbo.Level1")
        for r in mssql_cursor.fetchall():
            l1_map[r['lv1_pk']] = str(r['lv1_ID'])
            
        # L2 Map: PK -> UUID
        l2_map = {}
        mssql_cursor.execute("SELECT lv2_pk, lv2_ID FROM dbo.Level2")
        for r in mssql_cursor.fetchall():
            l2_map[r['lv2_pk']] = str(r['lv2_ID'])
            
        # L5 Info: PK -> {Code, Name}
        l5_info = {}
        mssql_cursor.execute("SELECT lv5_PK, DESCRIPT FROM dbo.Level5") # Fixed Keys
        for r in mssql_cursor.fetchall():
            l5_info[r['lv5_PK']] = {
                'name': r['DESCRIPT']
            }
            
        # Postgres Brand Map: (CatID, BrandCode) -> BrandID
        # We need this because Brand IDs are generated UUIDs in Postgres
        print("Fetching Postgres Brand Map...")
        pg_cursor.execute("SELECT id, inventory_category_id, code FROM inventory_brand")
        pg_brands = pg_cursor.fetchall()
        pg_brand_map = {} # (cat_id, code) -> brand_id
        for r in pg_brands:
            pg_brand_map[(str(r[1]), str(r[2]))] = str(r[0])
            
        # Verify valid Subcategories in PG
        pg_cursor.execute("SELECT id FROM inventory_subcategory")
        valid_subcats = set(str(r[0]) for r in pg_cursor.fetchall())
        
        print(f"Loaded {len(pg_brand_map)} Brands and {len(valid_subcats)} Subcategories from PG.")
        
        # Ensure Uncategorized Category exists
        uncat_cat_id = str(uuid.uuid4())
        uncategorized_sub_id = str(uuid.uuid4())
        
        pg_cursor.execute("SELECT id FROM inventory_category WHERE name = 'Uncategorized'")
        res = pg_cursor.fetchone()
        if res:
             uncat_cat_id = res[0]
        else:
             pg_cursor.execute(
                 "INSERT INTO inventory_category (id, name, code, is_active) VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
                 (uncat_cat_id, 'Uncategorized', 'UNC', True)
             )
             pg_conn.commit()
             print("Created 'Uncategorized' Category.")
             
        # Ensure Uncategorized Subcategory exists
        pg_cursor.execute("SELECT id FROM inventory_subcategory WHERE name = 'Uncategorized'")
        res = pg_cursor.fetchone()
        if res:
            uncategorized_sub_id = res[0]
        else:
            pg_cursor.execute(
                "INSERT INTO inventory_subcategory (id, inventory_category_id, name, code, is_active) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
                (uncategorized_sub_id, uncat_cat_id, 'Uncategorized', 'UNC', True)
            )
            pg_conn.commit()
            print("Created 'Uncategorized' Subcategory.")
            
        valid_subcats.add(str(uncategorized_sub_id))
        
        # Load Lookup Map from migrate_lookup.py output
        # This contains: values (lc_pk -> {value, id}), types (lb_pk -> name), type_ids (name -> uuid)
        try:
            with open('lookup_map.json', 'r') as f:
                lookup_data = json.load(f)
                lookup_map = lookup_data.get('values', {})
                type_map = lookup_data.get('types', {})
                type_ids = lookup_data.get('type_ids', {})
        except:
            print("⚠️ lookup_map.json not found. Color and attribute mapping will be limited.")
            lookup_map = {}
            type_map = {}
            type_ids = {}
            
        # Build reverse lookup: attribute_type -> (value_text -> value_id)
        # This helps find attribute IDs by type name and value text
        pg_cursor.execute("""
            SELECT av.id, av.value, at.name as type_name
            FROM item_attribute_value av
            JOIN item_attribute_type at ON at.id = av.attribute_type_id
        """)
        attr_lookup = {}  # {type_name: {value_text: value_id}}
        for row in pg_cursor.fetchall():
            val_id, val_text, type_name = str(row[0]), row[1], row[2]
            if type_name not in attr_lookup:
                attr_lookup[type_name] = {}
            attr_lookup[type_name][val_text.upper().strip()] = val_id
        
        # Build category map to identify firearms
        pg_cursor.execute("SELECT id, code, name FROM inventory_category")
        firearm_category_ids = set()
        for row in pg_cursor.fetchall():
            cat_id, code, name = str(row[0]), row[1], row[2]
            # Identify firearm categories by code or name
            if code and ('GUN' in code.upper() or 'FIREARM' in code.upper()):
                firearm_category_ids.add(cat_id)
            elif name and ('GUN' in name.upper() or 'FIREARM' in name.upper()):
                firearm_category_ids.add(cat_id)

        # ==================================
        # 2. Fetch Inventory Items
        # ==================================
        print("Fetching items from SQL Server...")
        mssql_cursor.execute("""
           SELECT 
              i.ITEMS_PK, i.Items_ID, i.usr_fk,
              i.LEVEL1_FK, i.LEVEL2_FK, i.LEVEL5_FK,
              i.STATUS, i.MODELNUM, i.SERIALNUM, i.Color, i.Condition,
              i.OnHand, i.AMOUNT, i.RESALEAMT, i.LOWSLPRICE, i.INSREPCOST,
              i.DateItemEntered, i.INVNUM, 
              i.DESCRIPT, i.DESCRIPT2, i.BIN, i.Composit3
           FROM dbo.items i
           WHERE (i.DateItemEntered >= '1900-01-01' OR i.DateItemEntered IS NULL)
        """)
        items = mssql_cursor.fetchall()
        
        # Fetch Details
        mssql_cursor.execute("SELECT * FROM Detail_J")
        jewelry_details = {row['Items_FK']: row for row in mssql_cursor.fetchall()}
        
        mssql_cursor.execute("SELECT * FROM dbo.Detail_G")
        gun_details = {row['Items_FK']: row for row in mssql_cursor.fetchall()}
        
        mssql_cursor.execute("SELECT * FROM dbo.stones")
        stones_rows = mssql_cursor.fetchall()
        stones_map = {}
        for s in stones_rows:
            fk = s['JDT_FK']
            if fk not in stones_map: stones_map[fk] = []
            stones_map[fk].append(s)

        # ==================================
        # 3. Migrate Items
        # ==================================
        batch_size = 1000
        batch_data = []
        errors = 0
        
        # print("Migrating...")
        for row in tqdm(items):
            try:
                # 1. Resolve Subcategory (Mandatory)
                # Items must have L2 -> Subcategory
                l2_fk = row['LEVEL2_FK']
                if not l2_fk:
                    # Fallback to Uncategorized
                    subcat_uuid = uncategorized_sub_id
                else:
                    subcat_uuid = l2_map.get(l2_fk)
                    if not subcat_uuid or subcat_uuid not in valid_subcats:
                        subcat_uuid = uncategorized_sub_id
                
                # 2. Resolve Brand (Optional)
                brand_uuid = None
                l1_fk = row['LEVEL1_FK']
                l5_fk = row['LEVEL5_FK']
                
                if l1_fk and l5_fk:
                    cat_uuid = l1_map.get(l1_fk)
                    brand_info = l5_info.get(l5_fk)
                    if cat_uuid and brand_info:
                        # Reconstruct Code logic
                        b_name = (brand_info['name'] or 'Unknown').strip()
                        b_code = b_name[:3].strip().upper() # Derived Code
                        
                        brand_uuid = pg_brand_map.get((cat_uuid, b_code))

                # 3. Attributes & Other Fields
                item_pk = row['ITEMS_PK']
                item_uuid = str(row['Items_ID']) if row.get('Items_ID') else str(uuid.uuid4())
                
                status_char = str(row['STATUS']).strip()
                status_code = status_char if len(status_char) == 1 else 'I'
                
                # Define helper for lookup resolution
                def resolve_lookup(fk):
                    if not fk:
                        return None
                    data = lookup_map.get(fk)
                    if isinstance(data, dict):
                        return data.get('value')
                    return data  # Fallback for old format

                # Details
                extra_data = {}
                attributes = {}
                
                # Determine if item is firearm based on category
                cat_uuid = l1_map.get(l1_fk) if l1_fk else None
                is_firearm = cat_uuid in firearm_category_ids if cat_uuid else False
                
                # Parse Composit3 field if available
                composit3_str = safe_str(row.get('Composit3'))
                if composit3_str:
                    if is_firearm:
                        composit3_attrs = parse_composit3_firearm(composit3_str, attr_lookup)
                    else:
                        composit3_attrs = parse_composit3_jewelry(composit3_str, attr_lookup)
                    attributes.update(composit3_attrs)
                
                # Jewelry
                if item_pk in jewelry_details:
                    jd = jewelry_details[item_pk]
                    
                    gender = resolve_lookup(jd.get('Gender_FK'))
                    if gender: extra_data['gender'] = gender
                    
                    size_len = resolve_lookup(jd.get('Sizelen_FK'))
                    if size_len: extra_data['size'] = size_len
                    
                    metal = resolve_lookup(jd.get('Metal_FK'))
                    if metal: attributes['metal'] = metal
                    
                    style = resolve_lookup(jd.get('Style_FK'))
                    if style: attributes['style'] = style
                    
                    karat = resolve_lookup(jd.get('Karat_FK'))
                    if karat: attributes['karat'] = karat
                    
                    # Weights (direct values)
                    # Convert Decimal to float for JSON serialization
                    weight = jd.get('Weight')
                    if weight is not None:
                        extra_data['weight'] = float(weight)
                    
                    # Stones
                    sk = jd.get('JDT_PK')
                    if sk and sk in stones_map:
                        extra_data['stones'] = [
                            {'type': safe_str(s.get('TYPE')), 'shape': safe_str(s.get('SHAPE')), 'qty': s.get('QTY')}
                            for s in stones_map[sk]
                        ]
                
                # Guns
                if item_pk in gun_details:
                    gd = gun_details[item_pk]
                    # resolve_lookup is already defined above
                        
                    action = resolve_lookup(gd.get('Action_FK'))
                    if action: attributes['action'] = action
                    
                    caliber = resolve_lookup(gd.get('Caliber_FK'))
                    if caliber: attributes['caliber'] = caliber
                    
                    finish = resolve_lookup(gd.get('Finish_FK'))
                    if finish: attributes['finish'] = finish
                    
                    barrel = resolve_lookup(gd.get('Barrel_FK'))
                    if barrel: attributes['barrel'] = barrel
                    
                    condition = resolve_lookup(gd.get('Condition_FK'))
                    if condition: attributes['condition'] = condition
                    
                    importer = resolve_lookup(gd.get('ImporterFK'))
                    if importer: extra_data['importer'] = importer
                
                # Color - Get UUID from item_attribute_value
                color_uuid = None
                color_fk = row['Color']
                if color_fk and str(color_fk) in lookup_map:
                    color_data = lookup_map[str(color_fk)]
                    # lookup_map[lc_pk] = {"value": text, "id": uuid}
                    if isinstance(color_data, dict):
                        color_uuid = color_data.get('id')
                    # Fallback for old format (just text)
                    # else: color_uuid = None
                
                # Dates
                created_at = row['DateItemEntered'] or datetime.now()
                
                # Legacy Columns
                # CAT_DESC and BRAND_COLOR_DESC were removed from query as they were invalid
                # We can populate legacy fields with available data
                
                batch_data.append((
                    item_uuid,
                    subcat_uuid,
                    brand_uuid,
                    status_code,
                    safe_str(row['MODELNUM']),
                    safe_str(row['SERIALNUM']),
                    color_uuid,
                    safe_str(row['Condition']),
                    max(1, int(float(row['OnHand'] or 0))), # Enforce quantity > 0
                    row['AMOUNT'],
                    row['RESALEAMT'],
                    row['LOWSLPRICE'],
                    row['INSREPCOST'],
                    None, # owner_mark
                    safe_str(row['DESCRIPT']), # Item Description
                    safe_str(row['BIN']), # Bin Location
                    row.get('storagefee'),
                    json.dumps(extra_data),
                    json.dumps(attributes),
                    safe_str(row['INVNUM']), # legacy_inventory_number
                    safe_str(row['Items_ID']),   # legacy_item_guid (Using Items_ID as proxy)
                    None, # legacy_category_description
                    safe_str(row['DESCRIPT2']), # legacy_brand_color_description
                    safe_str(row['INVNUM']), # inventory_number
                    user_map.get(str(row['usr_fk'])), # last_updated_user_id
                    created_at,
                    created_at
                ))
                
                if len(batch_data) >= batch_size:
                    _insert_batch(pg_cursor, batch_data)
                    pg_conn.commit()
                    batch_data = []
                    
            except Exception as e:
                pg_conn.rollback()
                errors += 1
                # Silent fail for individual items
                if errors < 10: # Keep original behavior of printing first few errors
                    print(f"  Error processing item {row.get('ITEMS_PK')}: {e}")

        if batch_data:
            _insert_batch(pg_cursor, batch_data)
            pg_conn.commit()
            
        print(f"✅ Inventory Migration Completed! ({errors} errors/skipped)")
        
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
            id, 
            inventory_subcategory_id, 
            inventory_brand_id,
            status, 
            model, 
            serial_number, 
            color, 
            item_condition, 
            quantity, 
            price_amount, 
            resale, 
            min_resale, 
            item_replace, 
            owner_mark,
            item_description, 
            bin_location, 
            storage_fee, 
            extra, 
            attributes, 
            legacy_inventory_number,
            legacy_item_guid,
            legacy_category_description,
            legacy_brand_color_description,
            inventory_number,
            last_updated_user_id,
            created_at, 
            updated_at
        ) VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            last_updated_user_id = EXCLUDED.last_updated_user_id,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_inventory()
