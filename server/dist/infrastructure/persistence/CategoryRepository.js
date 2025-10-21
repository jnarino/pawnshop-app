"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
class CategoryRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async listFlat() {
        const result = await this.pool.query(`
            SELECT id, name, code, parent_id, path::text
            FROM inventory_category
            ORDER BY path
        `);
        return result.rows;
    }
    async create(data) {
        const result = await this.pool.query(`INSERT INTO inventory_category (name, code, parent_id)
             VALUES ($1, $2, $3)
             RETURNING id`, [data.name, data.code, data.parent_id]);
        return { id: result.rows[0].id };
    }
}
exports.CategoryRepository = CategoryRepository;
