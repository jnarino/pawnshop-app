import psycopg2
from config import POSTGRES_CONFIG

def seed_statuses():
    print("🌱 Seeding Inventory Statuses...")
    
    conn = psycopg2.connect(**POSTGRES_CONFIG)
    cur = conn.cursor()
    
    statuses = [
        ('I', 'Inventory', False),
        ('S', 'Sold', True),
        ('L', 'Layaway', False),
        ('P', 'Pawned', False),
        ('V', 'Void', True),
        ('D', 'Defaulted', False),
        ('B', 'Buy', False),
        ('C', 'Confiscated', True),
        ('H', 'Hold', False),
        ('J', 'Junk', True),
        ('O', 'Other', False),
        ('T', 'Transfer', True),
        ('U', 'Unredeemed', False)
    ]
    
    try:
        for code, desc, terminal in statuses:
            # Check if exists
            cur.execute("SELECT 1 FROM inventory_status WHERE code = %s", (code,))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO inventory_status (code, description, is_terminal, active)
                    VALUES (%s, %s, %s, true)
                """, (code, desc, terminal))
        
        conn.commit()
        print(f"✅ Seeded {len(statuses)} statuses")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to seed statuses: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    seed_statuses()
