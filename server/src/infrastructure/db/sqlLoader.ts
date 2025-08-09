import fs from 'fs';
import path from 'path';

const SQL_CACHE: Record<string, string> = {};

const BASE_DIR = path.resolve(__dirname); // .../infrastructure/db

function loadSQLFile(relPath: string): string {
  const absolutePath = path.join(BASE_DIR, relPath);
  if (!SQL_CACHE[absolutePath]) {
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`SQL file not found: ${absolutePath}`);
    }
    SQL_CACHE[absolutePath] = fs.readFileSync(absolutePath, 'utf-8');
  }
  return SQL_CACHE[absolutePath];
}

/**
 * getSQL('command','customer','createCustomer')
 * -> loads: infrastructure/db/command/customer/createCustomer.sql
 */
export function getSQL(type: 'command' | 'query', domain: string, fileName: string): string {
  return loadSQLFile(`${type}/${domain}/${fileName}.sql`);
}
