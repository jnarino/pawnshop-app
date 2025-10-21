import { Pool } from 'pg';
import { getSQL } from "../db/sqlLoader";

export interface CategoryRow {
    id: string;
    name: string;
    code: string;
    parent_id: string | null;
}

export class CategoryRepository {
    constructor(private pool: Pool) {}

    async listFlat(): Promise<Array<{
        id: string;
        name: string;
        code: string;
        parent_id: string | null;
        path: string;
    }>> {
        const result = await this.pool.query(`
            SELECT id, name, code, parent_id, path::text
            FROM inventory_category
            ORDER BY path
        `);
        return result.rows;
    }

    async create(data: {
        name: string;
        code: string;
        parent_id: string | null;
    }): Promise<{ id: string }> {
        const result = await this.pool.query(
            `INSERT INTO inventory_category (name, code, parent_id)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [data.name, data.code, data.parent_id]
        );
        return { id: result.rows[0].id };
    }
}