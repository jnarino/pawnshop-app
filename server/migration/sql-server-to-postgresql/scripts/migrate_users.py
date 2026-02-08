import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG
import bcrypt

# Default password hash for "user"
# bcrypt.hashpw requires bytes, so we encode "user"
# keys are generated with a salt
salt = bcrypt.gensalt()
DEFAULT_PASSWORD_HASH = bcrypt.hashpw("user".encode('utf-8'), salt).decode('utf-8')

def migrate_users():
    print("🚀 Starting Users Migration (v2)...")
    
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Fetch Users
        # Fetch Users
        mssql_cursor.execute("SELECT * FROM dbo.users")
        users = mssql_cursor.fetchall()
        
        user_map = {} # Old PK -> New UUID
        batch_size = 1000
        batch_data = []
        
        batch_data = []
        for row in tqdm(users):
            old_pk = str(row['USR_PK'])
            
            # Map USR_LANID to username
            username = str(row['USR_LANID'] or '').strip()
            if not username:
                # Fallback to USR_ID if LANID empty? Or skip?
                # User request said "username is USR_LANID"
                # If USR_LANID is empty, try USR_ID as fallback or skip
                username = str(row['USR_ID'] or '').strip()
                if not username:
                    print(f"Skipping user with empty username/lanid (PK: {old_pk})")
                    continue

            # Check if user already exists (by username)
            pg_cursor.execute("SELECT id FROM app_user WHERE username = %s", (username,))
            existing = pg_cursor.fetchone()
            
            if existing:
                new_id = str(existing[0])
                # We could update here if we want to refresh data
            else:
                new_id = str(uuid.uuid4())
                
                # Logic for Role: USR_MENUACCESS
                # >= 90: Admin (1)
                # >= 10: Manager (2)
                # Else: Sales Associate (3)
                security_level = row.get('USR_MENUACCESS', 0)
                try:
                    sec_val = int(security_level)
                except (ValueError, TypeError):
                    sec_val = 0

                if sec_val >= 90:
                    role_id = 1
                elif sec_val >= 10:
                    role_id = 2
                else:
                    role_id = 3

                # Address mapping
                street_address = (row['USR_ADD1'] or '').strip()
                suite_number = (row['USR_ADD2'] or '').strip()
                
                # Phone mapping (AC + Number)
                ac1 = (row.get('USR_AC1') or '').strip()
                phone_body = (row['USR_PHONE1'] or '').strip()
                phone_number = f"{ac1}{phone_body}"

                # Prepare row
                batch_data.append((
                    new_id,
                    username,
                    DEFAULT_PASSWORD_HASH,
                    (row['USR_FNAME'] or '').strip(),
                    (row['USR_MNAME'] or '').strip(),
                    (row['USR_LNAME'] or '').strip(),
                    street_address,
                    suite_number,
                    (row['USR_CITY'] or '').strip(),
                    (row['USR_STATE'] or '').strip(),
                    (row['USR_ZIP'] or '').strip(),
                    phone_number,
                    (row['USR_SSNUM'] or '').strip(),
                    row['USR_BIRTHDATE'],
                    row['USR_STARTDATE'],
                    row.get('USR_TERMINATE'), # Use correct col if known, else check keys again if fails
                    bool(row.get('USR_ACTIVE', 1)),
                    role_id,
                    old_pk, # legacy_usr_pk
                    str(row.get('USR_ID') or '').strip() if row.get('USR_ID') else None # legacy_usr_id
                ))
            
            user_map[old_pk] = new_id
            
            # Map legacy_usr_id as well if available
            legacy_usr_id = row.get('USR_ID')
            if legacy_usr_id:
                user_map[str(legacy_usr_id).strip()] = new_id
            
            if len(batch_data) >= batch_size:
                _insert_batch(pg_cursor, batch_data)
                pg_conn.commit()
                batch_data = []
                
        # Insert remaining
        if batch_data:
            _insert_batch(pg_cursor, batch_data)
            pg_conn.commit()
            
        # Save Map
        # Save Map
        with open('user_map.json', 'w') as f:
            json.dump(user_map, f, indent=2)
            
        print("✅ Users Migration Completed!")
        
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
        INSERT INTO app_user (
            id, username, password_hash, 
            first_name, middle_name, last_name, 
            street_address, suite_number, city, state_us, zip_code, phone_number, ss_number, birth_date,
            starting_date, terminated_date, is_active, role_id, legacy_usr_pk, legacy_usr_id
        ) VALUES %s
        ON CONFLICT (username) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            street_address = EXCLUDED.street_address,
            suite_number = EXCLUDED.suite_number,
            phone_number = EXCLUDED.phone_number,
            role_id = EXCLUDED.role_id,
            legacy_usr_pk = EXCLUDED.legacy_usr_pk,
            legacy_usr_id = EXCLUDED.legacy_usr_id
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_users()
