import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
from tqdm import tqdm
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def migrate_customers():
    print("🚀 Starting Customer Migration...")
    
    # Load Lookup Map
    try:
        with open('lookup_map.json', 'r') as f:
            lookup_map = json.load(f) # Legacy ID (str) -> New UUID (str)
    except FileNotFoundError:
        print("❌ lookup_map.json not found. Run migrate_lookup.py first.")
        return

    # Connect to databases
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # 1. Build Text Map from Lookup_C (for Race, ID Type)
        print("Building Text Map from Lookup_C...")
        mssql_cursor.execute("SELECT lc_pk, lc_Descript FROM Lookup_C")
        text_map = {str(row['lc_pk']): row['lc_Descript'].strip() for row in mssql_cursor.fetchall()}
        
        # 2. Fetch Customers
        print("Fetching Customers from SQL Server...")
        mssql_cursor.execute("SELECT * FROM dbo.cust")
        # Fetch all at once or chunk? 55k is small enough for memory.
        customers = mssql_cursor.fetchall()
        print(f"Found {len(customers)} customers")
        
        customer_map = {} # Old PK -> New UUID
        batch_size = 1000
        batch_data = []
        
        print("Migrating...")
        for row in tqdm(customers):
            new_id = str(uuid.uuid4())
            old_pk = str(row['Cus_PK'])
            
            # Cleaning
            first_name = (row['CUS_FNAME'] or '').strip() or '.'
            last_name = (row['CUS_LNAME'] or '').strip() or '.'
            
            # Mappings
            hair_color_text = text_map.get(str(row['CUS_HAIRFK']))
            eye_color_text = text_map.get(str(row['CUS_EYESFK']))
            race_text = text_map.get(str(row['CUS_RACEFK']))
            id_type_text = text_map.get(str(row['CUS_IDTYP1']))
            
            # Prepare row
            batch_data.append((
                new_id,
                old_pk,
                str(row['Cus_id']) if row['Cus_id'] else None,
                first_name,
                (row['CUS_MNAME'] or '').strip(),
                last_name,
                (row['CUS_ADD1'] or '').strip(),
                (row['CUS_ADD2'] or '').strip(),
                (row['CUS_CITY'] or '').strip(),
                (row['CUS_STATE'] or '').strip(),
                (row['CUS_ZIP'] or '').strip(),
                (row['CUS_PHONE1'] or '').strip(),
                (row['CUS_HEIGHT'] or '').strip(),
                str(row['CUS_WEIGHT']) if row['CUS_WEIGHT'] else None,
                hair_color_text,
                eye_color_text,
                race_text,
                (row['CUS_SEX'] or '').strip(),
                (row['CUS_MARKS'] or '').strip(),
                row['CUS_BIRTHDate'],
                (row['CUS_BIRTHCITY'] or '').strip(),
                (row['CUS_BIRTHSTATE'] or '').strip(),
                # ID Info
                id_type_text,
                (row['CUS_IDNUM1'] or '').strip(),
                row['CUS_ID1EXP'],
                row['Cus_ID1IssueDate'], # Correct case
                (row['CUS_SSNUM'] or '').strip(),
                (row['CUS_IDADD1'] or '').strip(),
                (row['CUS_IDADD2'] or '').strip(),
                (row['CUS_IDCITY'] or '').strip(),
                (row['CUS_IDSTATE'] or '').strip(),
                (row['CUS_IDZIP'] or '').strip(),
                # Employer
                (row['CUS_EMPLOYER'] or '').strip(),
                (row['CUS_EMPAD1'] or '').strip(),
                (row['CUS_EMPAD2'] or '').strip(),
                (row['CUS_EMPCITY'] or '').strip(),
                (row['CUS_EMPSTATE'] or '').strip(),
                (row['CUS_EMPZIP'] or '').strip(),
                (row['CUS_EMPPHONE'] or '').strip(),
                # Misc
                (row['CUS_COMMENT'] or '').strip(),
                (row['CUS_FFLNUM'] or '').strip(),
                bool(row['CUS_LOCKED']),
                (row['Cus_TaxID'] or '').strip(),
                (row['Cus_CellPhone'] or '').strip(),
                (row['Cus_Email'] or '').strip(),
                row['Cus_Entered'],
                bool(row['Cus_Military']),
                row['Cus_FFLExpireDate'],
                bool(row['cus_taxexempt'])
            ))
            
            customer_map[old_pk] = new_id
            
            if len(batch_data) >= batch_size:
                _insert_batch(pg_cursor, batch_data)
                pg_conn.commit()
                batch_data = []
                
        # Insert remaining
        if batch_data:
            _insert_batch(pg_cursor, batch_data)
            pg_conn.commit()
            
        # Save Map
        print(f"\nSaving Customer Map ({len(customer_map)} entries)...")
        with open('customer_map.json', 'w') as f:
            json.dump(customer_map, f, indent=2)
            
        print("✅ Customer Migration Completed!")
        
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
        INSERT INTO customer (
            id, old_customer_pk, old_customer_id,
            first_name, middle_name, last_name,
            street_address, suite_number, city, state_us, zip_code,
            phone_number, height, weight,
            hair_color, eye_color, race, sex, marks,
            date_of_birth, birth_city, birth_state,
            id_type, id_number, id_expiration, id_issue_date,
            ss_number, id_address, id_suite_number, id_city, id_state, id_zip,
            employer_name, employer_address, employer_suite_number,
            employer_city, employer_state, employer_zip, employer_phone_number,
            description, ffl_number, locked, tax_id, cell_phone, email,
            entered_at, military, ffl_expire_date, tax_exempt
        ) VALUES %s
        ON CONFLICT (id) DO NOTHING
    """
    execute_values(cursor, sql, data)

if __name__ == "__main__":
    migrate_customers()
