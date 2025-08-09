"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSQL = getSQL;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SQL_CACHE = {};
const BASE_DIR = path_1.default.resolve(__dirname); // .../infrastructure/db
function loadSQLFile(relPath) {
    const absolutePath = path_1.default.join(BASE_DIR, relPath);
    if (!SQL_CACHE[absolutePath]) {
        if (!fs_1.default.existsSync(absolutePath)) {
            throw new Error(`SQL file not found: ${absolutePath}`);
        }
        SQL_CACHE[absolutePath] = fs_1.default.readFileSync(absolutePath, 'utf-8');
    }
    return SQL_CACHE[absolutePath];
}
/**
 * getSQL('command','customer','createCustomer')
 * -> loads: infrastructure/db/command/customer/createCustomer.sql
 */
function getSQL(type, domain, fileName) {
    return loadSQLFile(`${type}/${domain}/${fileName}.sql`);
}
