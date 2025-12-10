import psycopg2
import uuid
from config import POSTGRES_CONFIG

def seed_pawn_types():
    print("🌱 Seeding Pawn Transaction Types & Rate Plan...")
    
    conn = psycopg2.connect(**POSTGRES_CONFIG)
    cur = conn.cursor()
    
    # 1. Seed Transaction Types
    types = [
        ('PAWN', 'New Pawn Loan'),
        ('PURCHASE', 'Direct Purchase'),
        ('EXTENSION', 'Loan Extension'),
        ('REDEMPTION', 'Loan Redemption'),
        ('RENEWAL', 'Loan Renewal'),
        ('VOID', 'Void Transaction'),
        ('POLICE_HOLD', 'Police Hold'),
        ('CONFISCATION', 'Confiscation')
    ]
    
    try:
        for code, desc in types:
            cur.execute("SELECT 1 FROM pawn_transaction_type WHERE code = %s", (code,))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO pawn_transaction_type (code, description, active)
                    VALUES (%s, %s, true)
                """, (code, desc))
        
        # 2. Seed Default Rate Plan
        cur.execute("SELECT id FROM rate_plan LIMIT 1")
        if not cur.fetchone():
            rate_plan_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO rate_plan (
                    id, name, 
                    periodic_rate, min_finance_charge, 
                    period_days, grace_days, 
                    extend_on_interest_payment, extension_days_per_payment,
                    active
                ) VALUES (
                    %s, 'Standard Plan',
                    0.2500, 3.00,
                    30, 0,
                    true, 30,
                    true
                )
            """, (rate_plan_id,))
            print(f"  Created default rate plan: {rate_plan_id}")
        
        conn.commit()
        print(f"✅ Seeded {len(types)} transaction types")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to seed pawn types: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    seed_pawn_types()
