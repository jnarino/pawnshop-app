import fs from 'fs';
import path from 'path';

const cache = new Map<string, string>();

export function loadSql(group: 'commands' | 'queries', name: string): string {
  const key = `${group}/${name}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const filePath = path.join(__dirname, 'sql', group, `${name}.sql`);
  const sql = fs.readFileSync(filePath, 'utf8');
  cache.set(key, sql);
  return sql;
}
