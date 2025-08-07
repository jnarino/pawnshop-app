// server/src/infrastructure/db/index.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function loadSql(folder: 'command' | 'query', file: string): string {
    return readFileSync(join(__dirname, folder, `${file}.sql`), 'utf-8');
}

export const sql = {
    command: {
        createCustomer: loadSql('command', 'customer/createCustomer'),
        updateCustomer: loadSql('command', 'customer/updateCustomer'),
        deleteCustomer: loadSql('command', 'customer/deleteCustomer'),
        // …etc.
    },
    query: {
        findAllCustomers: loadSql('query', 'customer/findAllCustomers'),
        findCustomerById: loadSql('query', 'customer/findCustomerById'),
        // …etc.
    }
};
