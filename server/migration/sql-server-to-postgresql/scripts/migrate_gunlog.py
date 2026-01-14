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
    return str(value).replace('\x00', '').strip() if value else None

def migrate_gunlog():
    print("🚀 Starting Gun Log Migration...")
    
    # Load User Map
    try:
        with open('user_map.json', 'r') as f:
            user_map = json.load(f)
    except:
        print("⚠️ user_map.json not found, legacy_user_id will be NULL")
        user_map = {}

    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Get max TRANSNUM for gun_transfer_number_next
        print("Determining max gun transfer number...")
        mssql_cursor.execute("SELECT MAX(CAST(TRANSNUM AS INT)) AS max_transnum FROM dbo.gunlog WHERE TRANSNUM IS NOT NULL AND ISNUMERIC(TRANSNUM) = 1")
        max_transnum_row = mssql_cursor.fetchone()
        if max_transnum_row and max_transnum_row.get('max_transnum'):
            max_transnum = max_transnum_row.get('max_transnum')
            next_gun_transfer = max_transnum + 1
            print(f"  Max TRANSNUM found: {max_transnum}, setting next to {next_gun_transfer}")
            pg_cursor.execute(
                "UPDATE app_settings SET value = %s WHERE key = 'gun_transfer_number_next'",
                (str(next_gun_transfer),)
            )
            pg_conn.commit()

        # Fetch Gun Log records
        print("Fetching gun log records from SQL Server...")
        mssql_cursor.execute("""
            SELECT 
                GunLog_PK, GunLogNum, Prev_GunLogRec, Next_GunLogRec, INVNUM,
                MANUFACTUR, MODEL, SERIAL, CALIBER, ACTION, CONDITION,
                BUYAMT, BUYDATE, BUYFNAME, BUYMNAME, BUYLNAME, BUYADD1, BuyAdd2, BUYCITY, BUYSTATE, BUYZIP, BUYIDTYPE, BUYIDNUM,
                SOLDDATE, SOLDFNAME, SOLDMNAME, SOLDLNAME, SOLDADD1, SoldAdd2, SOLDCITY, SOLDSTATE, SOLDZIP, SOLDAMT, SOLDIDTYPE, SOLDIDNUM,
                TRANSNUM, COMMENT1, COMMENT2, VOIDED, CHANGED, GUNTYPE, IMPORTER, NICSTN, GUN_id, LastUpdatedUSR_ID,
                OrigManufacturer, OrigModel, OrigSerial, OrigCaliber, OrigAction, OrigBuyDate,
                OrigBuyFName, OrigBuyMName, OrigBuyLName, OrigBuyAdd1, OrigBuyAdd2, OrigBuyCity, OrigBuyState, OrigBuyZip,
                OrigBuyIDType, OrigBuyIDNum, OrigSoldDate, OrigSoldFName, OrigSoldMName, OrigSoldLName,
                OrigSoldAdd1, OrigSoldAdd2, OrigSoldCity, OrigSoldState, OrigSoldZip, OrigSoldIDType, OrigSoldIDNum,
                OrigTransNum, OrigGunType, OrigImporter, OrigNICSTN
            FROM dbo.gunlog
            ORDER BY GunLogNum
        """)
        
        records = mssql_cursor.fetchall()
        print(f"Found {len(records)} gun log records to migrate")
        
        # Build inventory item map
        print("Building inventory item mapping...")
        pg_cursor.execute("SELECT legacy_inventory_number, id FROM inventory_item WHERE legacy_inventory_number IS NOT NULL")
        item_map = {str(row[0]): str(row[1]) for row in pg_cursor.fetchall()}
        
        batch_size = 500
        batch_data = []
        errors = 0
        skipped = 0
        
        print("Migrating...")
        for row in tqdm(records):
            try:
                gunlog_id = str(uuid.uuid4())
                
                # Map inventory item - REQUIRED
                legacy_invnum = safe_str(row.get('INVNUM'))
                inventory_item_id = item_map.get(legacy_invnum) if legacy_invnum else None
                
                if not inventory_item_id:
                    # Skip records without valid inventory linkage
                    skipped += 1
                    if skipped <= 10:
                        print(f"  Skipping gunlog {row.get('GunLogNum')}: no inventory item for INVNUM={legacy_invnum}")
                    continue
                
                # User mapping
                legacy_user_id = None
                usr_id = row.get('LastUpdatedUSR_ID')
                if usr_id:
                    legacy_user_id = user_map.get(str(usr_id))
                
                # Parse amounts
                buyer_amount = None
                sold_amount = None
                try:
                    if row.get('BUYAMT'):
                        buyer_amount = float(row.get('BUYAMT'))
                except (ValueError, TypeError):
                    pass
                try:
                    if row.get('SOLDAMT'):
                        sold_amount = float(row.get('SOLDAMT'))
                except (ValueError, TypeError):
                    pass
                
                # Legacy GUN_id
                legacy_gun_id = None
                gun_id = row.get('GUN_id')
                if gun_id:
                    try:
                        legacy_gun_id = str(gun_id)
                    except:
                        pass
                
                batch_data.append((
                    gunlog_id,
                    row.get('GunLog_PK'),
                    row.get('GunLogNum'),
                    row.get('Prev_GunLogRec'),
                    row.get('Next_GunLogRec'),
                    inventory_item_id,
                    safe_str(row.get('MANUFACTUR')),
                    safe_str(row.get('MODEL')),
                    safe_str(row.get('SERIAL')),
                    safe_str(row.get('CALIBER')),
                    safe_str(row.get('ACTION')),
                    safe_str(row.get('CONDITION')),
                    buyer_amount,
                    row.get('BUYDATE'),
                    safe_str(row.get('BUYFNAME')),
                    safe_str(row.get('BUYMNAME')),
                    safe_str(row.get('BUYLNAME')),
                    safe_str(row.get('BUYADD1')),
                    safe_str(row.get('BuyAdd2')),
                    safe_str(row.get('BUYCITY')),
                    safe_str(row.get('BUYSTATE')),
                    safe_str(row.get('BUYZIP')),
                    safe_str(row.get('BUYIDTYPE')),
                    safe_str(row.get('BUYIDNUM')),
                    row.get('SOLDDATE'),
                    safe_str(row.get('SOLDFNAME')),
                    safe_str(row.get('SOLDMNAME')),
                    safe_str(row.get('SOLDLNAME')),
                    safe_str(row.get('SOLDADD1')),
                    safe_str(row.get('SoldAdd2')),
                    safe_str(row.get('SOLDCITY')),
                    safe_str(row.get('SOLDSTATE')),
                    safe_str(row.get('SOLDZIP')),
                    sold_amount,
                    safe_str(row.get('SOLDIDTYPE')),
                    safe_str(row.get('SOLDIDNUM')),
                    safe_str(row.get('TRANSNUM')),
                    safe_str(row.get('COMMENT1')),
                    safe_str(row.get('COMMENT2')),
                    bool(row.get('VOIDED', False)),
                    bool(row.get('CHANGED', False)),
                    safe_str(row.get('GUNTYPE')),
                    safe_str(row.get('IMPORTER')),
                    safe_str(row.get('NICSTN')),
                    legacy_gun_id,
                    legacy_user_id,
                    # Original values
                    safe_str(row.get('OrigManufacturer')),
                    safe_str(row.get('OrigModel')),
                    safe_str(row.get('OrigSerial')),
                    safe_str(row.get('OrigCaliber')),
                    safe_str(row.get('OrigAction')),
                    row.get('OrigBuyDate'),
                    safe_str(row.get('OrigBuyFName')),
                    safe_str(row.get('OrigBuyMName')),
                    safe_str(row.get('OrigBuyLName')),
                    safe_str(row.get('OrigBuyAdd1')),
                    safe_str(row.get('OrigBuyAdd2')),
                    safe_str(row.get('OrigBuyCity')),
                    safe_str(row.get('OrigBuyState')),
                    safe_str(row.get('OrigBuyZip')),
                    safe_str(row.get('OrigBuyIDType')),
                    safe_str(row.get('OrigBuyIDNum')),
                    row.get('OrigSoldDate'),
                    safe_str(row.get('OrigSoldFName')),
                    safe_str(row.get('OrigSoldMName')),
                    safe_str(row.get('OrigSoldLName')),
                    safe_str(row.get('OrigSoldAdd1')),
                    safe_str(row.get('OrigSoldAdd2')),
                    safe_str(row.get('OrigSoldCity')),
                    safe_str(row.get('OrigSoldState')),
                    safe_str(row.get('OrigSoldZip')),
                    safe_str(row.get('OrigSoldIDType')),
                    safe_str(row.get('OrigSoldIDNum')),
                    safe_str(row.get('OrigTransNum')),
                    safe_str(row.get('OrigGunType')),
                    safe_str(row.get('OrigImporter')),
                    safe_str(row.get('OrigNICSTN'))
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
        print(f"   Total Records: {len(records)}")
        print(f"   Migrated: {len(records) - errors - skipped}")
        print(f"   Skipped (no inventory): {skipped}")
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
        INSERT INTO gunlog (
            id, legacy_gunlog_pk, gunlog_number, prev_gunlog_rec, next_gunlog_rec,
            inventory_item_id, manufacturer, model, serial, caliber, action, condition,
            buyer_amount, buyer_date, buyer_first_name, buyer_middle_name, buyer_last_name,
            buyer_street_address, buyer_id_address, buyer_city, buyer_state_us, buyer_zip_code,
            buyer_id_type, buyer_id_number,
            sold_date, sold_first_name, sold_middle_name, sold_last_name,
            sold_street_address, sold_id_address, sold_city, sold_state_us, sold_zip_code,
            sold_amount, sold_id_type, sold_id_number,
            transaction_num, notes_1, notes_2, voided, changed, guntype, importer, nicstn,
            legacy_gun_id, legacy_user_id,
            orig_manufacturer, orig_model, orig_serial, orig_caliber, orig_action, orig_buy_date,
            orig_buy_fname, orig_buy_mname, orig_buy_lname, orig_buy_add1, orig_buy_add2,
            orig_buy_city, orig_buy_state, orig_buy_zip, orig_buy_id_type, orig_buy_id_num,
            orig_sold_date, orig_sold_fname, orig_sold_mname, orig_sold_lname, orig_sold_add1,
            orig_sold_add2, orig_sold_city, orig_sold_state, orig_sold_zip, orig_sold_id_type,
            orig_sold_id_num, orig_trans_num, orig_guntype, orig_importer, orig_nicstn
        ) VALUES %s
        ON CONFLICT (gunlog_number) DO NOTHING
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_gunlog()
