import pymssql
import os
import sys
import json

# Add scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))
from config import SQLSERVER_CONFIG

def analyze_database():
    print("Connecting to SQL Server...")
    try:
        # Filter config for pymssql
        conn_config = {k: v for k, v in SQLSERVER_CONFIG.items() if k in ['host', 'port', 'user', 'password', 'database', 'server']}
        if 'host' in conn_config:
            conn_config['server'] = conn_config.pop('host')
            
        conn = pymssql.connect(**conn_config)
        cursor = conn.cursor(as_dict=True)
        
        stats = {}
        
        # 1. Analyze dbo.gunlog columns
        print("\nAnalyzing dbo.gunlog columns...")
        cursor.execute("SELECT TOP 1 * FROM dbo.gunlog")
        row = cursor.fetchone()
        if row:
            print(f"Columns in dbo.gunlog: {list(row.keys())}")
            print(f"Sample gunlog: {row}")

        # 2. Find Gun Log Table
        print("\nSearching for Gun Log table...")
        cursor.execute("SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE '%Gun%'")
        gun_tables = cursor.fetchall()
        if gun_tables:
            table_names = [f"{t['TABLE_SCHEMA']}.{t['TABLE_NAME']}" for t in gun_tables]
            print(f"Found potential Gun Log tables: {table_names}")
        else:
            print("No table with 'Gun' in name found.")
            
        # 3. Counts and Years (Refined)
        print("\nGathering Table Statistics (Refined)...")
        
        # Customer
        cursor.execute("SELECT COUNT(*) as count FROM dbo.cust")
        stats['customer_count'] = cursor.fetchone()['count']
        
        # Pawn Tickets (Filter invalid dates < 1980)
        cursor.execute("SELECT COUNT(*) as count, MIN(DATEIN) as min_date, MAX(DATEIN) as max_date FROM dbo.pawn WHERE DATEIN > '1980-01-01'")
        row = cursor.fetchone()
        stats['pawn_count'] = row['count']
        stats['pawn_min_date'] = str(row['min_date'])
        stats['pawn_max_date'] = str(row['max_date'])
        
        # Inventory (Filter invalid dates < 1980)
        cursor.execute("SELECT COUNT(*) as count, MIN(DateItemEntered) as min_date, MAX(DateItemEntered) as max_date FROM dbo.items WHERE DateItemEntered > '1980-01-01'")
        row = cursor.fetchone()
        stats['inventory_count'] = row['count']
        stats['inventory_min_date'] = str(row['min_date'])
        stats['inventory_max_date'] = str(row['max_date'])

            
        print("\n=== Database Statistics ===")
        print(json.dumps(stats, indent=2))
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_database()
