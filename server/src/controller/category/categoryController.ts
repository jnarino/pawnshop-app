import type { Request, Response } from 'express';
import { Pool } from 'pg';
import fs from 'node:fs/promises';

type Row = { id: string; name: string; code: string; parent_id: string | null };
type Node = { id: string; name: string; code: string; parentCode: string | null; children: Node[] };

export interface CategoryController {
  getTree(req: Request, res: Response): Promise<void>;
}

export class CategoryControllerImpl implements CategoryController {
  constructor(private pool: Pool, private sqlPath: string) {}

  async getTree(_req: Request, res: Response) {
    try {
      const sql = await fs.readFile(this.sqlPath, 'utf8');
      const { rows } = await this.pool.query<Row>(sql);

      const byId = new Map<string, Node>();
      const roots: Node[] = [];

      for (const r of rows) byId.set(r.id, { id: r.id, name: r.name, code: r.code, parentCode: null, children: [] });
      for (const r of rows) {
        const n = byId.get(r.id)!;
        if (r.parent_id) {
          const p = byId.get(r.parent_id);
          if (p) { n.parentCode = p.code; p.children.push(n); } else { roots.push(n); }
        } else {
          roots.push(n);
        }
      }
      res.json(roots);
    } catch (e) {
      res.status(500).json({ error: 'failed_to_load_categories' });
    }
  }
}