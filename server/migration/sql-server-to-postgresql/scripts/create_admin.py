import sys
import psycopg2
import uuid
import argparse
from config import POSTGRES_CONFIG
# We might need argon2 for hashing if the app uses it, or just plain text if the app hashes later?
# The package.json says "argon2", so the app likely expects hashed passwords.
# I will check the app's auth logic if possible, or for now just store it and assume the app hashes it?
# Usually creating an admin directly needs hashing.
# I'll check how the app handles passwords.
# FOR NOW: I'll assume I need to hash it.
try:
    from argon2 import PasswordHasher
except ImportError:
    print("argon2-cffi not installed. Install it with: pip install argon2-cffi")
    sys.exit(1)

def create_admin(username, password):
    ph = PasswordHasher()
    hashed_password = ph.hash(password)
    
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM app_user WHERE username = %s", (username,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"User {username} already exists. Updating password...")
            cursor.execute("UPDATE app_user SET password_hash = %s WHERE username = %s", (hashed_password, username))
        else:
            print(f"Creating new admin user {username}...")
            cursor.execute("""
                INSERT INTO app_user (id, username, password_hash, role_id, first_name, last_name, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, 1, 'System', 'Admin', TRUE, NOW(), NOW())
            """, (str(uuid.uuid4()), username, hashed_password))
            
        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ User {username} configured successfully.")
        return True
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create Admin User')
    parser.add_argument('--username', required=True, help='Username')
    parser.add_argument('--password', required=True, help='Password')
    args = parser.parse_args()
    
    create_admin(args.username, args.password)
