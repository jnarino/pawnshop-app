"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.pool = void 0;
// server/src/infrastructure/db/index.ts
const fs_1 = require("fs");
const path_1 = require("path");
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
function loadSql(folder, file) {
    return (0, fs_1.readFileSync)((0, path_1.join)(__dirname, folder, `${file}.sql`), 'utf-8');
}
exports.sql = {
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
