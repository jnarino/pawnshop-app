"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const db_1 = require("../db");
const sqlLoader_1 = require("../db/sqlLoader");
class CategoryRepository {
    async listFlat() {
        const sql = (0, sqlLoader_1.getSQL)('query', 'inventory', 'listcategoriesTree');
        const { rows } = await db_1.pool.query(sql);
        return rows;
    }
}
exports.CategoryRepository = CategoryRepository;
