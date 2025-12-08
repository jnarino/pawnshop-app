"""
Simple database cleanup script for SQL Server
Drops and recreates the PawnMaster_v2 database
"""
import pymssql
import sys

def clean_database():
    """Drop and recreate the PawnMaster_v2 database"""
    print("🧹 Cleaning SQL Server database...")
    
    # SQL Server connection config
    SQLSERVER_CONFIG = {
        'server': 'localhost',
        'port': 1433,
        'user': 'sa',
        'password': 'YourStrong!Passw0rd',
        'database': 'master'
    }
    
    try:
        conn = pymssql.connect(**SQLSERVER_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Force single user mode and drop database
        print("  Setting database to single user mode...")
        try:
            cursor.execute("""
                IF EXISTS (SELECT name FROM sys.databases WHERE name = 'PawnMaster_v2')
                BEGIN
                    ALTER DATABASE PawnMaster_v2 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE PawnMaster_v2;
                END
            """)
            print("  Database dropped successfully")
        except Exception as e:
            print(f"  Note: {e}")
        
        cursor.close()
        conn.close()
        
        print("✅ SQL Server database cleaned successfully!")
        print("\nNext steps:")
        print("1. Restore the database from backup:")
        print("   docker exec -it pawnshop_sql /opt/mssql-tools18/bin/sqlcmd \\")
        print("     -S localhost -U sa -P 'YourStrong!Passw0rd' \\")
        print("     -C -i /var/opt/mssql/scripts/restore.sql")
        
    except Exception as e:
        print(f"❌ Error cleaning database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    response = input("⚠️  This will DELETE the PawnMaster_v2 database. Continue? (yes/no): ")
    if response.lower() == 'yes':
        clean_database()
    else:
        print("Cancelled.")
