"""
Migration Configuration
"""
import os
from dotenv import load_dotenv

# Load .env from parent directory
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

# Database Connection Configurations
SQLSERVER_CONFIG = {
    'host': os.getenv('SQLSERVER_HOST', 'localhost'),
    'port': int(os.getenv('SQLSERVER_PORT', 1433)),
    'database': os.getenv('SQLSERVER_DB', 'PawnMaster_v2'),
    'user': os.getenv('SQLSERVER_USER', 'sa'),
    'password': os.getenv('SQLSERVER_PASSWORD', 'YourStrong!Passw0rd'),
    'driver': 'ODBC Driver 18 for SQL Server',
    'trust_cert': 'yes'
}

POSTGRES_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', 5432)),
    'database': os.getenv('POSTGRES_DB', 'pawnshop'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '123456')
}

# Migration Settings
BATCH_SIZE = 1000
START_YEAR = 1991
END_YEAR = 2025

# Safety Settings
DRY_RUN = False  # Set to True to test without committing
STOP_ON_ERROR = True
