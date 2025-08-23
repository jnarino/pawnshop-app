import { pool } from "../db";
import { getSQL } from "../db/sqlLoader";

export interface CategoryRow {
    id: string;
    name: string;
    code: string;
    parent_id: string | null;
}

export class CategoryRepository {
    async listFlat(): Promise<CategoryRow[]> {
        const sql = getSQL('query', 'inventory', 'listcategoriesTree');
        const { rows } = await pool.query<CategoryRow>(sql);
        return rows;
    }
}