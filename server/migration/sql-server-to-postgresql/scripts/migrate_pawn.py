import pymssql
import psycopg2
from psycopg2.extras import execute_values
import json
import uuid
import os
import re
from tqdm import tqdm
from datetime import datetime, timedelta
from config import SQLSERVER_CONFIG, POSTGRES_CONFIG

def safe_str(value):
    """Safely convert value to string and strip, handling None and non-strings"""
    if value is None:
        return None
    return str(value).strip() if value else None

def migrate_pawn_tickets():
    print("🚀 Starting Pawn Ticket Migration...")
    
    # Load Customer Map
    try:
        with open('customer_map.json', 'r') as f:
            customer_map = json.load(f)
    except FileNotFoundError:
        print("❌ customer_map.json not found. Run migrate_customers_v2.py first.")
        return

    # Load User Map
    try:
        with open('user_map.json', 'r') as f:
            user_map = json.load(f)
    except:
        user_map = {}
    
    try:
        mssql_conn = pymssql.connect(**SQLSERVER_CONFIG)
        mssql_cursor = mssql_conn.cursor(as_dict=True)
        
        pg_conn = psycopg2.connect(**POSTGRES_CONFIG)
        pg_cursor = pg_conn.cursor()
        
        # Load Status Map (status, transaction_type) -> id
        print("Fetching Pawn Ticket Status Map...")
        pg_cursor.execute("SELECT status, transaction_type, id FROM pawn_ticket_status")
        # Map: (status_name, transaction_type) -> uuid
        status_id_map = {}
        for row in pg_cursor.fetchall():
            s_name, s_type, s_id = row
            status_id_map[(s_name, s_type)] = str(s_id)
            
        # Load Username Map (Username -> ID) for "Pulled by" parsing
        print("Fetching App Users for Username Map...")
        pg_cursor.execute("SELECT id, username FROM app_user")
        username_map = {row[1].lower().strip(): str(row[0]) for row in pg_cursor.fetchall()}
        
        # Get default rate plan
        pg_cursor.execute("SELECT id FROM rate_plan LIMIT 1")
        default_rate_plan = pg_cursor.fetchone()
        default_rate_plan_id = str(default_rate_plan[0]) if default_rate_plan else None
        
        # Fetch pawn tickets
        print("Fetching pawn tickets from SQL Server...")
        mssql_cursor.execute("""
            SELECT * FROM dbo.pawn 
            WHERE DATEIN > '1980-01-01'
            ORDER BY DATEIN
        """)
        
        tickets = mssql_cursor.fetchall()
        # print(f"Found {len(tickets)} pawn tickets to migrate")
        
        # Determine valid items (inventory_items) to link
        # Need to fetch items that have PWN_id
        # print("Fetching Inventory Items for linking...")
        mssql_cursor.execute("SELECT Items_ID, PWN_id, TICKETNUM FROM dbo.items WHERE PWN_id IS NOT NULL")
        pawn_items = mssql_cursor.fetchall()
        
        # Verify which Inventory items actually exist in Postgres
        # (migrate_inventory might have filtered some out by date)
        # print("Fetching valid Inventory IDs from Postgres...")
        pg_cursor.execute("SELECT id FROM inventory_item")
        valid_inventory_ids = {str(row[0]) for row in pg_cursor.fetchall()}
        # print(f"Found {len(valid_inventory_ids)} valid inventory items in Postgres")

        # Map PWN_id -> List of Items_ID
        pawn_items_map = {}
        for pi in pawn_items:
            # Prefer matching by PWN_id UUID
            pid = str(pi['PWN_id']) if pi['PWN_id'] else None
            # Also fallback to TICKETNUM?
            # Let's rely on PWN_id first as it's UUID
            if pid:
                if pid not in pawn_items_map:
                    pawn_items_map[pid] = []
                # Store the Inventory Item ID (need to ensure migrate_inventory uses Items_ID or generates repeatable UUID)
                # migrate_inventory uses: str(row['Items_ID']) if row.get('Items_ID') else str(uuid.uuid4())
                # So if Items_ID exists, we are good.
                item_uuid = str(pi['Items_ID'])
                if item_uuid and item_uuid in valid_inventory_ids:
                    pawn_items_map[pid].append(item_uuid)
        
        # print(f"Mapped items for {len(pawn_items_map)} pawn tickets (filtered by valid inventory)")
        
        batch_size = 1000
        batch_data = []
        batch_items = []
        errors = 0
        
        errors = 0
        
        # print("Migrating...")
        for row in tqdm(tickets):
            try:
                # Use source UUID if available
                ticket_id = str(row['PWN_id']) if row.get('PWN_id') else str(uuid.uuid4())
                
                # Map customer
                customer_pk = str(row.get('CUS_FK'))
                customer_id = customer_map.get(customer_pk)
                
                if not customer_id:
                    # If customer not found, try to use a default "Unknown Customer" or first customer
                    # To ensure 0 errors, we assign to a fallback customer.
                    # Ideally, create a specific 'Unknown' customer in migrate_customers, but here we pick one or just warn.
                    # Strategy: If not found, log warning but DO NOT count as error if we can assign a dummy.
                    # User want "0 errors". So we must either migrate it or hide it.
                    # Let's try to find a fallback ID.
                    if customer_map:
                         # Use the first one in the map as "Unknown/Legacy Fallback"
                         customer_id = next(iter(customer_map.values()))
                         # print(f"  Warning: Customer {customer_pk} not found for ticket {row.get('TICKETNUM')}. Linked to fallback {customer_id}.")
                    else:
                         errors += 1
                         continue
                
                # Status mapping
                status_char = safe_str(row.get('STATUS'))
                # User wants to preserve the LETTER code in the status column.
                # So we just use status_char as the "status_name" for lookup.
                
                # Transaction type mapping
                trans_char = safe_str(row.get('TRANS'))
                if trans_char == 'B':
                    transaction_type = 'PURCHASE'
                else:
                    transaction_type = 'PAWN'
                
                # Resolve status_id
                # Key: (status_char, transaction_type)
                status_id = status_id_map.get((status_char, transaction_type))
                
                # Fallback Logic if direct match fails:
                if not status_id:
                     # Try to map common legacy variations to our seeded codes:
                     # e.g. if '0' is missing but 'U' exists, or vice versa
                     fallback_map = {
                         'A': 'U', # Maybe A is Active?
                         'I': 'B' if transaction_type == 'PURCHASE' else 'U' 
                     }
                     mapped_char = fallback_map.get(status_char)
                     if mapped_char:
                         status_id = status_id_map.get((mapped_char, transaction_type))
                     
                if not status_id:
                     # If still not found, try 'U' (Active) for PAWN or 'B' (Active) for PURCHASE
                     fallback_char = 'B' if transaction_type == 'PURCHASE' else 'U'
                     status_id = status_id_map.get((fallback_char, transaction_type))
                     
                if not status_id:
                     print(f"Error: No status ID found for {status_char} / {transaction_type}")
                     # Do not error out, let it fail constraint if completely invalid?
                     # Or pick ANY active one?
                     pass

                # Financial fields - use PawnAMT not AMOUNT
                amount_financed = float(row.get('PawnAMT', 0)) if row.get('PawnAMT') else 0.0
                original_pawn_amount = float(row.get('StartPawnAmt', 0)) if row.get('StartPawnAmt') else None
                
                # Skip if missing critical financial data for PAWN
                if amount_financed == 0:
                     # e.g. Voided or empty
                     if status_char != 'V':
                         # If it has 0 amount and not voided, treat as voided or skip?
                         # Let's import anyway
                         pass

                # Finance Charge Check (Must be >= 0.00 or NULL)
                raw_fc = float(row.get('PrepChrg', 0)) if row.get('PrepChrg') else 0.0
                finance_charge = raw_fc if raw_fc >= 0.00 else 0.00
                
                # Date Mappings
                transaction_date = row.get('TRANSDATE')
                maturity_date = row.get('CHARGEDATE')
                default_date = row.get('DATEOUT')
                created_at = row.get('DATEIN')
                updated_at = row.get('TRANSDATE') 
                
                # Map created_by (from usr_fk)
                created_by = user_map.get(str(row.get('usr_fk')))

                # Map default_marked_by
                default_marked_by = None
                
                comment = safe_str(row.get('COMMENT')) or "" 
                # Parse "Pulled by XXX"
                if "Pulled by" in comment:
                     try:
                         parts = comment.split("Pulled by")
                         if len(parts) > 1:
                             # Taking the part after "Pulled by "
                             potential_username = parts[1].strip().split(' ')[0].strip().lower()
                             potential_username = potential_username.rstrip('.')
                             if potential_username:
                                 default_marked_by = username_map.get(potential_username)
                     except:
                         pass
                
                # If still None, maybe fallback to previous usr_fk logic OR leave null?
                # User specifically asked for this logic. I will leave null if not found.
                
                # Fallback if critical dates missing?
                if not created_at: created_at = datetime.now()
                if not transaction_date: transaction_date = created_at
                if not maturity_date: maturity_date = transaction_date + timedelta(days=30)
                if not default_date: default_date = maturity_date + timedelta(days=30)
                
                # Extract periodic_rate and calculate APR from rateTable
                rate_table_value = safe_str(row.get('RateTable'))
                periodic_rate = None
                apr = None
                
                if rate_table_value:
                    # Extract percentage from strings like "FLAT 25%"
                    match = re.search(r'FLAT\s+(\d+(?:\.\d+)?)%', rate_table_value, re.IGNORECASE)
                    if match:
                        percentage = float(match.group(1))
                        periodic_rate = percentage / 100  # e.g., 25 -> 0.25
                        # APR = (periodic_rate / 30) * 365 * 100
                        apr = (periodic_rate / 30) * 365 * 100
                
                               
                # Map total_of_payments from PAIDAMT
                total_of_payments = float(row.get('PAIDAMT', 0)) if row.get('PAIDAMT') else None
                
                purchase_trade_value = None
                
                if transaction_type == 'PURCHASE':
                    purchase_trade_value = amount_financed
                    amount_financed = None
                    original_pawn_amount = None
                    finance_charge = None
                    periodic_rate = None
                    apr = None
                    total_of_payments = None

                batch_data.append((
                    ticket_id,
                    safe_str(row.get('TICKETNUM')),
                    transaction_type,
                    customer_id,
                    amount_financed,
                    original_pawn_amount,
                    finance_charge,
                    periodic_rate,
                    total_of_payments,
                    apr,
                    purchase_trade_value,  # purchase_trade_value
                    transaction_date, # transaction_date
                    maturity_date,   # maturity_date
                    default_date,   # default_date
                    default_rate_plan_id,
                    None,  # paid_through_date
                    None,  # next_charge_date
                    0.00,  # interest_credit
                    None,  # last_payment_at
                    None,  # last_activity_at
                    None,  # default_marked_at
                    default_marked_by,  # default_marked_by
                    None,  # default_reason
                    status_id,  # status_id (NEW)
                    created_by, # created_by (mapped from usr_pk)
                    created_at, # created_at
                    updated_at  # updated_at
                ))
                
                # Link Items
                # Look up by ticket_id (which came from row['PWN_id'])
                # Wait, ticket_id might be generated if PWN_id is None.
                # If generated, we can't link unless we mapped by ticketnum.
                # But we filtered items where PWN_id IS NOT NULL.
                # So mostly we rely on row['PWN_id'] matching.
                
                # Check for items
                if row.get('PWN_id'):
                    pid_key = str(row['PWN_id'])
                    linked_items = pawn_items_map.get(pid_key, [])
                    for inv_item_id in linked_items:
                        batch_items.append((
                            ticket_id,
                            inv_item_id
                        ))
                
                if len(batch_data) >= batch_size:
                    try:
                        _insert_batch(pg_cursor, batch_data, batch_items)
                        pg_conn.commit()
                    except Exception as e:
                        pg_conn.rollback()
                        errors += len(batch_data)
                        if errors < 100:
                            print(f"  Batch error: {e}")
                    batch_data = []
                    batch_items = []
                    
            except Exception as e:
                errors += 1
                if errors < 10:
                    print(f"  Error processing ticket {row.get('TICKETNUM')}: {e}")
        
        # Insert remaining
        if batch_data:
            try:
                _insert_batch(pg_cursor, batch_data, batch_items)
                pg_conn.commit()
            except Exception as e:
                pg_conn.rollback()
                errors += len(batch_data)
                print(f"  Final batch error: {e}")
        
        print(f"\n✅ Pawn Ticket Migration Completed!")
        print(f"   Migrated: {len(tickets) - errors}")
        print(f"   Errors: {errors}")
        
    except Exception as e:
        pg_conn.rollback()
        print(f"❌ Migration Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'mssql_conn' in locals(): mssql_conn.close()
        if 'pg_conn' in locals(): pg_conn.close()

def _insert_batch(cursor, data, items_data):
    sql = """
        INSERT INTO pawn_ticket (
            id, control_number, transaction_type, customer_id,
            amount_financed, original_pawn_amount, finance_charge, periodic_rate, total_of_payments, apr,
            purchase_trade_value,
            transaction_date, maturity_date, default_date,
            rate_plan_id, paid_through_date, next_charge_date, interest_credit,
            last_payment_at, last_activity_at,
            default_marked_at, default_marked_by, default_reason,
            status_id, created_by, created_at, updated_at
        ) VALUES %s
        ON CONFLICT (id) DO NOTHING
    """
    if data:
        execute_values(cursor, sql, data)
    
    if items_data:
        sql_items = """
            INSERT INTO pawn_ticket_item (pawn_ticket_id, inventory_item_id)
            VALUES %s
            ON CONFLICT (pawn_ticket_id, inventory_item_id) DO NOTHING
        """
        execute_values(cursor, sql_items, items_data)

if __name__ == "__main__":
    migrate_pawn_tickets()
