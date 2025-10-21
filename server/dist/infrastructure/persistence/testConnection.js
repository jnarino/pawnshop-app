"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function testConnection() {
    try {
        const result = await db_1.pool.query('SELECT current_database(), current_user, version()');
        console.log('✓ Database connection successful!');
        console.log('Database:', result.rows[0].current_database);
        console.log('User:', result.rows[0].current_user);
        console.log('Version:', result.rows[0].version);
        await db_1.pool.end();
        process.exit(0);
    }
    catch (error) {
        console.error('✗ Database connection failed:', error);
        process.exit(1);
    }
}
testConnection();
