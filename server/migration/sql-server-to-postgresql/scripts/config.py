"""
Migration Configuration V2
"""
import os
import sys

# Add parent directory to path to find .env
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from dotenv import load_dotenv

# Load .env - check Docker location first, then project root
docker_env_path = '/migration/.env'
# Local path: scripts -> sql-server -> migration -> server (root)
project_env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')

if os.path.exists(docker_env_path):
    dotenv_path = docker_env_path
else:
    dotenv_path = project_env_path

load_dotenv(dotenv_path)

# Database Connection Configurations
SQLSERVER_CONFIG = {
    'server': os.getenv('SQLSERVER_HOST', 'localhost'),
    'port': int(os.getenv('SQLSERVER_PORT', 1433)),
    'database': os.getenv('SQLSERVER_DB', 'PawnMaster_v2'),
    'user': os.getenv('SQLSERVER_USER', 'sa'),
    'password': os.getenv('SQLSERVER_PASSWORD', 'YourStrong!Passw0rd')
}

POSTGRES_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', 5432)),
    'database': os.getenv('POSTGRES_DB', 'pawnshop'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', '123456')
}

# Mapping Configuration
# LB_FK -> (Target Type, Target Key/Group Code, Description)
# Target Type: 'color' or 'attribute'
LOOKUP_MAPPING = {
    # Colors
    2:  ('color', 'GENERIC_ITEM', 'General item colors'),
    3:  ('color', 'PERSON_HAIR', 'Hair colors'),
    11: ('color', 'FIREARM_FINISH', 'Firearm finishes'),
    13: ('color', 'JEWELRY_STONE_CLARITY', 'Stone clarity'),
    15: ('color', 'JEWELRY_STONE_COLOR', 'Gemstone colors'),
    20: ('color', 'JEWELRY_METAL_TONE', 'Metal tones'),
    25: ('color', 'VEHICLE_COLOR', 'Vehicle colors'),
    
    # Attributes
    0:  ('attribute', 'jewelry.type', 'Jewelry types'),
    4:  ('attribute', 'customer.id_type', 'ID Types'),
    5:  ('attribute', 'customer.race', 'Race'),
    8:  ('attribute', 'firearm.action', 'Firearm actions'),
    9:  ('attribute', 'firearm.barrel_type', 'Barrel configurations'),
    10: ('attribute', 'firearm.caliber', 'Calibers and gauges'),
    12: ('attribute', 'item.manufacturer', 'Manufacturers'),
    16: ('attribute', 'jewelry.stone.shape', 'Gemstone shapes'),
    17: ('attribute', 'jewelry.stone.type', 'Gemstone types'),
    18: ('attribute', 'item.gender', 'Gender/Style'),
    19: ('attribute', 'jewelry.metal', 'Metal types'),
    22: ('attribute', 'jewelry.stone.carat', 'Carat weights'),
    24: ('attribute', 'jewelry.style', 'Jewelry styles'),
    26: ('attribute', 'vehicle.body_style', 'Vehicle body styles')
}
