"""
Simple database cleanup script for PostgreSQL
Drops all tables and recreates the schema
"""
import psycopg2
import sys
import os

# Add scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

from config import POSTGRES_CONFIG

def clean_database():
    """Drop and recreate the public schema"""
    print("🧹 Cleaning PostgreSQL database...")
    
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Drop and recreate schema
        print("  Dropping public schema...")
        cursor.execute("DROP SCHEMA IF EXISTS public CASCADE;")
        
        print("  Creating public schema...")
        cursor.execute("CREATE SCHEMA public;")
        cursor.execute("GRANT ALL ON SCHEMA public TO postgres;")
        cursor.execute("GRANT ALL ON SCHEMA public TO public;")
        
        cursor.close()
        conn.close()
        
        print("✅ Database cleaned successfully!")
        print("\nNext steps:")
        print("1. Run the initial migration:")
        print("   cat ../src/infrastructure/db/migrations/0001_11072025_initial.sql | psql -U postgres -d pawnshop")
        print("2. Run the data migration:")
        print("   python3 scripts/migrate_all.py")
        
    except Exception as e:
        print(f"❌ Error cleaning database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Check for auto-confirm via environment variable (for non-interactive mode)
    auto_confirm = os.getenv('AUTO_CONFIRM', 'false').lower() == 'true'
    
    if not auto_confirm:
        response = input("⚠️  This will DELETE ALL DATA in the database. Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Aborted.")
            sys.exit(1)
    
    clean_database()
