"""
Table Mappings
Defines how SQL Server tables map to PostgreSQL tables
"""

# Table Mappings: Source Table -> Target Table
TABLE_MAP = {
    'dbo.cust': 'public.customer',
    'dbo.pawn': 'public.pawn_ticket',
    'dbo.inv': 'public.inventory_item',  # Assumed based on analysis
    # Add more mappings as needed
}

# Column Mappings: Target Table -> { Target Column: Source Column }
# If Source Column is None, it means it needs a default value or transformation
COLUMN_MAP = {
    'public.customer': {
        'first_name': 'CUS_FNAME',
        'last_name': 'CUS_LNAME',
        'middle_name': 'CUS_MNAME',
        'street_address': 'CUS_ADD1',
        'city': 'CUS_CITY',
        'state_us': 'CUS_STATE',
        'zip_code': 'CUS_ZIP',
        'phone_number': 'CUS_PHONE1',
        'date_of_birth': 'CUS_BIRTHDate',
        'birth_city': 'CUS_BIRTHCITY',
        'birth_state': 'CUS_BIRTHSTATE',
        'ss_number': 'CUS_SSNUM',
        'id_number': 'CUS_IDNUM1',
        'id_type': 'CUS_IDTYP1',
        'id_issue_date': 'CUS_ID1ISSUE',
        'id_expiration': 'CUS_ID1EXP',
        'employer_name': 'CUS_EMPLOYER',
        'employer_phone_number': 'CUS_EMPPHONE',
        'old_customer_pk': 'Cus_PK',
        'old_customer_id': 'CUS_IDNUM1',
        'entered_at': 'Cus_Entered',
        'updated_at': 'Cus_Entered'
    },
    'public.pawn_ticket': {
        'control_number': 'TICKETNUM',
        'transaction_date': 'DATEIN',
        'maturity_date': 'DATEOUT',
        'default_date': 'DATEOUT',
        'amount_financed': 'PawnAMT',
        # 'interest_rate': 'MONTHCHRG', # Not in target schema
        'pawn_status': 'STATUS',
        'customer_id': 'CUS_FK',
        'transaction_type': None, # Will be filled with default
        'created_at': 'DATEIN',
        'updated_at': 'DATEIN'
    },
    'public.inventory_item': {
        'status': 'STATUS',
        'item_description': 'DESCRIPT',
        'brand': None, 
        'model': 'MODELNUM',
        'serial_number': 'SERIALNUM',
        'price_amount': 'AMOUNT', # Cost?
        'resale': 'RESALEAMT',
        'category_id': 'LEVEL1_FK',
        'created_at': 'DateItemEntered',
        'updated_at': 'DateItemEntered',
        'inventory_number': 'INVNUM'
    }
}

# Update TABLE_MAP to use items table
TABLE_MAP['dbo.items'] = 'public.inventory_item'
if 'dbo.inv' in TABLE_MAP:
    del TABLE_MAP['dbo.inv']

# Data Type Transformations
def transform_date(value):
    """Transform SQL Server date to PostgreSQL timestamp"""
    if not value:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    return value

def transform_string(value):
    """Trim whitespace from strings and remove NUL bytes"""
    if isinstance(value, str):
        # Remove NUL bytes that PostgreSQL doesn't allow
        cleaned = value.replace('\x00', '').strip()
        return cleaned if cleaned else None
    return value

def transform_boolean(value):
    """Transform SQL Server bit to PostgreSQL boolean"""
    if value is None:
        return False
    return bool(value)

def transform_money(value):
    """Transform money to numeric"""
    if value is None:
        return 0.0
    return float(value)

def transform_status(value):
    """Map legacy status codes to PostgreSQL enum"""
    if not value:
        return 'active'
    
    value = str(value).upper().strip()
    mapping = {
        'U': 'active',      # Unredeemed?
        'I': 'active',      # In-pawn?
        'A': 'active',      # Active
        '0': 'active',
        '1': 'active',
        'D': 'defaulted',
        'R': 'redeemed',
        'V': 'voided',
        'P': 'police hold',
        'C': 'confiscation'
    }
    return mapping.get(value, 'active')
