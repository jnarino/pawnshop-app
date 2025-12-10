"""
Migration Engine
Core logic for database migration
"""
import sys
import time
import logging
from datetime import datetime
from sqlalchemy import create_engine, text, inspect
import pandas as pd
from tqdm import tqdm

from migrate_config import SQLSERVER_CONFIG, POSTGRES_CONFIG, BATCH_SIZE, DRY_RUN, STOP_ON_ERROR
from migration_logger import logger, stats
from table_mappings import TABLE_MAP, COLUMN_MAP, transform_date, transform_boolean, transform_money, transform_string, transform_status

class MigrationEngine:
    def __init__(self):
        self.sql_engine = self._get_sql_engine()
        self.pg_engine = self._get_pg_engine()
        self.batch_size = BATCH_SIZE
        
    def _get_sql_engine(self):
        """Create SQLAlchemy engine for SQL Server"""
        from urllib.parse import quote_plus
        password = quote_plus(SQLSERVER_CONFIG['password'])
        
        # Use pymssql as it's what we have working/installed
        conn_str = (
            f"mssql+pymssql://{SQLSERVER_CONFIG['user']}:{password}@"
            f"{SQLSERVER_CONFIG['host']}:{SQLSERVER_CONFIG['port']}/"
            f"{SQLSERVER_CONFIG['database']}"
        )
        return create_engine(conn_str)
        
    def _get_pg_engine(self):
        """Create SQLAlchemy engine for PostgreSQL"""
        conn_str = (
            f"postgresql://{POSTGRES_CONFIG['user']}:{POSTGRES_CONFIG['password']}@"
            f"{POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}/"
            f"{POSTGRES_CONFIG['database']}"
        )
        return create_engine(conn_str)
        
    def test_connections(self):
        """Test connections to both databases"""
        try:
            with self.sql_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Connected to SQL Server")
            
            with self.pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Connected to PostgreSQL")
            return True
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            return False

    def build_category_map(self):
        """Build mapping from legacy category ID (Level1) to new UUID"""
        logger.info("Building category map...")
        category_map = {}
        
        # Get legacy categories
        try:
            legacy_cats = pd.read_sql("SELECT lv1_pk, DESCRIPT FROM dbo.Level1", self.sql_engine)
        except Exception as e:
            logger.warning(f"Could not read Level1 table: {e}")
            return {}
            
        # Get new categories
        try:
            new_cats = pd.read_sql("SELECT id, name FROM public.inventory_category", self.pg_engine)
        except Exception as e:
            logger.warning(f"Could not read inventory_category table: {e}")
            return {}
            
        # Match by name (case insensitive)
        # Create lookup for new cats
        new_cat_lookup = {name.upper(): uid for name, uid in zip(new_cats['name'], new_cats['id'])}
        
        for _, row in legacy_cats.iterrows():
            legacy_id = row['lv1_pk']
            name = row['DESCRIPT'].strip().upper() if row['DESCRIPT'] else ''
            
            if name in new_cat_lookup:
                category_map[legacy_id] = new_cat_lookup[name]
            else:
                # Try partial match or mapping logic here if needed
                pass
                
        logger.info(f"Mapped {len(category_map)} categories")
        return category_map

    def build_customer_map(self):
        """Build mapping from legacy customer PK to new UUID"""
        logger.info("Building customer map...")
        try:
            # We assume old_customer_pk is populated during customer migration
            # We only need this for pawn tickets, so we can fetch all
            # For 50k rows, fetching all is fine (~2-3MB)
            df = pd.read_sql("SELECT old_customer_pk, id FROM public.customer WHERE old_customer_pk IS NOT NULL", self.pg_engine)
            customer_map = dict(zip(df['old_customer_pk'], df['id']))
            logger.info(f"Mapped {len(customer_map)} customers")
            return customer_map
        except Exception as e:
            logger.error(f"Failed to build customer map: {e}")
            return {}

    def migrate_table(self, source_table, target_table, year=None, date_column=None, mapping_context=None):
        """
        Migrate a single table, optionally filtered by year
        """
        logger.info(f"Starting migration: {source_table} -> {target_table}")
        stats.log_table_start(target_table)
        
        # Build query
        query = f"SELECT * FROM {source_table}"
        if year and date_column:
            query += f" WHERE YEAR({date_column}) = {year}"
            logger.info(f"Filtering for year {year}")
            
        # Get total count for progress bar
        try:
            count_query = f"SELECT COUNT(*) FROM {source_table}"
            if year and date_column:
                count_query += f" WHERE YEAR({date_column}) = {year}"
            
            with self.sql_engine.connect() as conn:
                total_rows = conn.execute(text(count_query)).scalar()
            
            logger.info(f"Found {total_rows} records to migrate")
        except Exception as e:
            logger.warning(f"Could not get row count: {e}")
            total_rows = 0
            
        if total_rows == 0:
            logger.info("No records to migrate")
            return

        # Process in batches
        offset = 0
        migrated_count = 0
        error_count = 0
        
        # We can't easily use OFFSET/FETCH in generic SQL Server queries without ORDER BY
        # So we'll stream the results using pandas chunks
        
        try:
            for chunk in pd.read_sql(query, self.sql_engine, chunksize=self.batch_size):
                if DRY_RUN:
                    logger.info(f"Dry run: Would migrate {len(chunk)} records")
                    migrated_count += len(chunk)
                    stats.log_progress(target_table, len(chunk))
                    continue
                    
                # Transform data
                transformed_data = self._transform_chunk(chunk, target_table, mapping_context)
                
                # Insert into PostgreSQL
                try:
                    transformed_data.to_sql(
                        target_table.split('.')[-1], 
                        self.pg_engine, 
                        schema=target_table.split('.')[0],
                        if_exists='append', 
                        index=False
                    )
                    migrated_count += len(chunk)
                    stats.log_progress(target_table, len(chunk))
                    
                except Exception as e:
                    logger.error(f"Batch insert failed: {e}")
                    error_count += len(chunk)
                    stats.log_progress(target_table, 0, errors=len(chunk))
                    if STOP_ON_ERROR:
                        raise e
                
                # Update progress
                print(f"\rProgress: {migrated_count}/{total_rows} records", end="", flush=True)
                
        except Exception as e:
            logger.error(f"Migration failed for {source_table}: {e}")
            raise e
            
        print() # New line
        logger.info(f"Completed {target_table}: {migrated_count} migrated, {error_count} errors")

    def _transform_chunk(self, chunk, target_table, mapping_context=None):
        """Transform a batch of data according to mappings"""
        if target_table not in COLUMN_MAP:
            return chunk
            
        mapping = COLUMN_MAP[target_table]
        transformed = pd.DataFrame()
        
        for target_col, source_col in mapping.items():
            if source_col and source_col in chunk.columns:
                # Direct mapping
                transformed[target_col] = chunk[source_col]
            elif source_col and source_col not in chunk.columns:
                # Source column missing in dataframe (maybe case sensitivity)
                # Try to find case-insensitive match
                found = False
                for col in chunk.columns:
                    if col.lower() == source_col.lower():
                        transformed[target_col] = chunk[col]
                        found = True
                        break
                if not found:
                    # logger.warning(f"Column {source_col} not found in source data")
                    transformed[target_col] = None
            else:
                # No source mapping or explicit None
                transformed[target_col] = None
        
        # Apply ID mappings if context provided
        if mapping_context:
            if target_table == 'public.inventory_item' and 'category_map' in mapping_context:
                # Map category_id
                cat_map = mapping_context['category_map']
                # Get a default category ID (first one in map) as fallback
                default_cat_id = next(iter(cat_map.values())) if cat_map else None
                
                transformed['category_id'] = transformed['category_id'].apply(
                    lambda x: cat_map.get(int(x), default_cat_id) if pd.notnull(x) and int(x) in cat_map else default_cat_id
                )
                
            if target_table == 'public.pawn_ticket' and 'customer_map' in mapping_context:
                # Map customer_id
                cust_map = mapping_context['customer_map']
                # Get a default customer ID (first one in map) as fallback
                default_cust_id = next(iter(cust_map.values())) if cust_map else None
                
                transformed['customer_id'] = transformed['customer_id'].apply(
                    lambda x: cust_map.get(int(x), default_cust_id) if pd.notnull(x) and int(x) in cust_map else default_cust_id
                )

        # Apply specific transformations based on target column name/type
        for col in transformed.columns:
            if 'date' in col or '_at' in col or 'dob' in col:
                # Use pandas to_datetime with coerce to handle invalid dates
                transformed[col] = pd.to_datetime(transformed[col], errors='coerce')
                # Convert NaT to None
                transformed[col] = transformed[col].replace({pd.NaT: None})
                
                # Handle NOT NULL constraints for timestamps
                if col in ['created_at', 'updated_at', 'entered_at'] and transformed[col].isnull().any():
                    transformed[col] = transformed[col].fillna(datetime.now())
                    
            elif 'is_' in col or 'active' in col:
                transformed[col] = transformed[col].apply(transform_boolean)
            elif col == 'pawn_status':
                transformed[col] = transformed[col].apply(transform_status)
            elif transformed[col].dtype == 'object':
                transformed[col] = transformed[col].apply(transform_string)
                
        # Set default transaction_type if missing
        if 'transaction_type' in transformed.columns and transformed['transaction_type'].isnull().any():
             transformed['transaction_type'] = transformed['transaction_type'].fillna('PAWN')
             
        # Handle required customer fields
        if target_table == 'public.customer':
            if 'first_name' in transformed.columns:
                transformed['first_name'] = transformed['first_name'].fillna('.')
            if 'last_name' in transformed.columns:
                transformed['last_name'] = transformed['last_name'].fillna('.')
                
        # Special handling for serial_number - generate unique values for placeholders
        if 'serial_number' in transformed.columns:
            placeholder_values = ['NONE', 'NA', 'N/A', 'UNKNOWN', 'NON', '']
            
            # Track which rows have placeholder values
            mask = transformed['serial_number'].apply(
                lambda x: (isinstance(x, str) and x.upper().strip() in placeholder_values) or pd.isna(x) or (isinstance(x, str) and not x.strip())
            )
            
            # For rows with placeholders, generate unique identifiers
            if mask.any():
                # Use inventory_number or row index to create unique values
                if 'inventory_number' in transformed.columns:
                    transformed.loc[mask, 'serial_number'] = transformed.loc[mask, 'inventory_number'].apply(
                        lambda x: f"NO-SERIAL-{x}" if pd.notnull(x) else None
                    )
                else:
                    # Fallback: use row index
                    transformed.loc[mask, 'serial_number'] = [f"NO-SERIAL-{i}" for i in range(mask.sum())]

                
        return transformed

if __name__ == "__main__":
    engine = MigrationEngine()
    engine.test_connections()
