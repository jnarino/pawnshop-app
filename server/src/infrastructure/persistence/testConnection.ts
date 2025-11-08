import { pool } from './db';

async function testConnection() {
  try {
    const result = await pool.query('SELECT current_database(), current_user, version()');
    console.log('✓ Database connection successful!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Version:', result.rows[0].version);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
