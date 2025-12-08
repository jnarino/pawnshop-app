"""
Migration Orchestrator
Main script to run the migration process
"""
import argparse
import sys
import time
from datetime import datetime

from migrate_config import START_YEAR, END_YEAR, DRY_RUN
from migrate_engine import MigrationEngine
from migration_logger import logger, stats
from table_mappings import TABLE_MAP

def parse_args():
    parser = argparse.ArgumentParser(description='PawnMaster to PostgreSQL Migration')
    parser.add_argument('--start-year', type=int, default=START_YEAR, help='Start year for migration')
    parser.add_argument('--end-year', type=int, default=END_YEAR, help='End year for migration')
    parser.add_argument('--tables', type=str, help='Comma-separated list of tables to migrate')
    parser.add_argument('--dry-run', action='store_true', help='Run without committing changes')
    parser.add_argument('--verify', action='store_true', help='Run verification after migration')
    return parser.parse_args()

def main():
    args = parse_args()
    
    print("=" * 80)
    print("PAWNMASTER MIGRATION TOOL")
    print("=" * 80)
    print(f"Start Year: {args.start_year}")
    print(f"End Year: {args.end_year}")
    print(f"Dry Run: {args.dry_run or DRY_RUN}")
    print("=" * 80)
    
    # Initialize engine
    engine = MigrationEngine()
    if not engine.test_connections():
        print("❌ Database connection failed. Check logs.")
        sys.exit(1)
        
    start_time = time.time()
    
    try:
        # Determine tables to migrate
        tables_to_migrate = []
        if args.tables:
            requested_tables = args.tables.split(',')
            for source, target in TABLE_MAP.items():
                if source in requested_tables or target in requested_tables:
                    tables_to_migrate.append((source, target))
        else:
            tables_to_migrate = list(TABLE_MAP.items())
            
        print(f"\n📋 Migrating {len(tables_to_migrate)} tables...")
        
        # Phase 0: Build static maps
        logger.info("Phase 0: Building static maps")
        category_map = engine.build_category_map()
        mapping_context = {'category_map': category_map}
        
        # Convert tables_to_migrate to a set of targets for easier lookup
        targets_to_migrate = {target for _, target in tables_to_migrate}
        
        # Phase 1: Master Data (Customers)
        if 'public.customer' in targets_to_migrate:
            logger.info("Phase 1: Migrating Customers (All Years)")
            engine.migrate_table('dbo.cust', 'public.customer')
            
            # Build customer map after migration
            if not args.dry_run:
                mapping_context['customer_map'] = engine.build_customer_map()
        
        # Phase 2: Transactional Data by Year
        logger.info(f"Starting migration from {args.start_year} to {args.end_year}")
        
        for year in range(args.start_year, args.end_year + 1):
            logger.info(f"=== Processing Year {year} ===")
            
            # 1. Inventory (Depends on Categories)
            if 'public.inventory_item' in targets_to_migrate:
                engine.migrate_table('dbo.items', 'public.inventory_item', year, 'DateItemEntered', mapping_context)
            
            # 2. Pawn Tickets (Depends on Customers)
            if 'public.pawn_ticket' in targets_to_migrate:
                engine.migrate_table('dbo.pawn', 'public.pawn_ticket', year, 'DATEIN', mapping_context)
            
        logger.info("Migration completed successfully!")
                    
    except KeyboardInterrupt:
        print("\n⚠️  Migration interrupted by user")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        stats.save_stats()
        duration = time.time() - start_time
        print(f"\n✅ Migration finished in {duration:.2f} seconds")
        if logger.handlers:
            print(f"📝 Logs saved to {logger.handlers[0].baseFilename}")
        else:
            print("📝 Logs saved to logs directory")

if __name__ == "__main__":
    main()
