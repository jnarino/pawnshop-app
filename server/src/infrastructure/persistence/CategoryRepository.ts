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
        const sql = getSQL('query', 'category', 'findAllCategories');
        const result = await this.pool.query(sql);
        return result.rows;
    }

    async create(data: {
        name: string;
        code: string;
        parent_id: string | null;
    }): Promise<{ id: string }> {
        const sql = getSQL('command', 'category', 'createCategory');
        const result = await this.pool.query(sql, [data.name, data.code, data.parent_id]);
        return { id: result.rows[0].id };
    }
}