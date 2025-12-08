"""
Migration Logger
Handles logging for the migration process
"""
import logging
import os
from datetime import datetime
import json

# Create logs directory
LOG_DIR = 'logs'
os.makedirs(LOG_DIR, exist_ok=True)

# Configure logging
log_filename = f"{LOG_DIR}/migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('migration')

class MigrationStats:
    def __init__(self):
        self.stats = {
            'start_time': datetime.now().isoformat(),
            'tables': {},
            'errors': []
        }
    
    def log_table_start(self, table_name):
        if table_name not in self.stats['tables']:
            self.stats['tables'][table_name] = {
                'processed': 0,
                'migrated': 0,
                'skipped': 0,
                'errors': 0
            }
    
    def log_progress(self, table_name, migrated, skipped=0, errors=0):
        if table_name in self.stats['tables']:
            self.stats['tables'][table_name]['migrated'] += migrated
            self.stats['tables'][table_name]['skipped'] += skipped
            self.stats['tables'][table_name]['errors'] += errors
            self.stats['tables'][table_name]['processed'] += (migrated + skipped + errors)
    
    def log_error(self, table_name, error_msg, record_id=None):
        error_entry = {
            'timestamp': datetime.now().isoformat(),
            'table': table_name,
            'error': str(error_msg),
            'record_id': str(record_id) if record_id else None
        }
        self.stats['errors'].append(error_entry)
        if table_name in self.stats['tables']:
            self.stats['tables'][table_name]['errors'] += 1
            
    def save_stats(self):
        self.stats['end_time'] = datetime.now().isoformat()
        stats_file = f"{LOG_DIR}/migration_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(stats_file, 'w') as f:
            json.dump(self.stats, f, indent=2)
        logger.info(f"Migration stats saved to {stats_file}")

# Global stats instance
stats = MigrationStats()
