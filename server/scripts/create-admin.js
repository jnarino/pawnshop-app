const argon2 = require('argon2');
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const PG_PORT = process.env.DB_PORT || process.env.POSTGRES_PORT || 5432;
const PG_USER = process.env.DB_USERNAME || process.env.POSTGRES_USER || 'postgres';
const PG_HOST = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';
const PG_DB = process.env.DB_NAME || process.env.POSTGRES_DB || 'pawnshop';
const PG_PASS = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres';

async function createAdmin() {
    console.log('Connecting to database...');
    console.log(`Host: ${PG_HOST}, Port: ${PG_PORT}, DB: ${PG_DB}, User: ${PG_USER}`);

    const client = new Client({
        user: PG_USER,
        host: PG_HOST,
        database: PG_DB,
        password: PG_PASS,
        port: parseInt(PG_PORT),
    });

    try {
        await client.connect();

        const username = process.argv[2] || 'admin';
        const password = process.argv[3] || 'admin';

        console.log(`Configuring admin user: ${username}`);

        // Hash password using Node argon2 (defaults used by the app)
        const passwordHash = await argon2.hash(password);

        // Check if user exists
        const res = await client.query('SELECT id FROM app_user WHERE username = $1', [username]);

        if (res.rows.length > 0) {
            console.log('User exists, updating password and details...');
            await client.query(`
                UPDATE app_user 
                SET password_hash = $1, 
                    role_id = 1, 
                    first_name = 'System', 
                    last_name = 'Admin', 
                    is_active = true, 
                    updated_at = NOW()
                WHERE username = $2
            `, [passwordHash, username]);
        } else {
            console.log('Creating new admin user...');
            await client.query(`
                INSERT INTO app_user (username, password_hash, role_id, first_name, last_name, is_active)
                VALUES ($1, $2, 1, 'System', 'Admin', true)
            `, [username, passwordHash]);
        }

        console.log('✅ Admin user configured successfully.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error creating admin user:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createAdmin();
