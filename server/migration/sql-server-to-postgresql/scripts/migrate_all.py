import os
import sys
import time

# Add current directory and v2 subdirectory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, 'v2'))

from migrate_lookup import migrate_lookup
from migrate_customers import migrate_customers
from migrate_categories import migrate_categories
from seed_statuses import seed_statuses
from migrate_inventory import migrate_inventory
from seed_pawn_types import seed_pawn_types
from migrate_pawn import migrate_pawn_tickets
from migrate_gunlog import migrate_gunlog
from migrate_sales import migrate_sales
from migrate_layaway import migrate_layaway
from migrate_pawn_payments import migrate_pawn_payments

def run_migration():
    start_total = time.time()
    print("🚀 STARTING FULL MIGRATION V2 🚀")
    print("=================================")
    
    # Phase 1: Reference Data
    print("\n📦 PHASE 1: Reference Data (Lookup_C)")
    migrate_lookup()
    
    # Phase 2: Customers
    print("\n👥 PHASE 2: Master Data (Customers)")
    migrate_customers()
    
    # Phase 2.5: Categories
    print("\n📂 PHASE 2.5: Categories")
    migrate_categories()
    
    # Phase 2.8: Seed Statuses
    print("\n🌱 PHASE 2.8: Seed Statuses")
    seed_statuses()
    
    # Phase 3: Inventory
    print("\n📦 PHASE 3: Inventory Items")
    migrate_inventory()
    
    # Phase 3.5: Seed Pawn Types
    print("\n🌱 PHASE 3.5: Seed Pawn Types")
    seed_pawn_types()
    
    # Phase 4: Pawn Tickets
    print("\n🎫 PHASE 4: Pawn Tickets")
    migrate_pawn_tickets()

    # Phase 4.5: Sales, Layaway, Pawn Payments
    print("\n💰 PHASE 4.5: Sales & Transactions")
    migrate_sales()
    print("\n🗓 PHASE 4.6: Layaway")
    migrate_layaway()
    print("\n💸 PHASE 4.7: Pawn Payments")
    migrate_pawn_payments()
    
    # Phase 5: Gun Log
    print("\n🔫 PHASE 5: Gun Log")
    migrate_gunlog()
    
    end_total = time.time()
    duration = end_total - start_total
    print("\n=================================")
    print(f"✅ FULL MIGRATION COMPLETED in {duration:.2f} seconds")
    print("=================================")

if __name__ == "__main__":
    run_migration()
