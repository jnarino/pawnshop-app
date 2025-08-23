"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryControllerImpl = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
class CategoryControllerImpl {
    constructor(pool, sqlPath) {
        this.pool = pool;
        this.sqlPath = sqlPath;
    }
    async getTree(_req, res) {
        try {
            const sql = await promises_1.default.readFile(this.sqlPath, 'utf8');
            const { rows } = await this.pool.query(sql);
            const byId = new Map();
            const roots = [];
            for (const r of rows)
                byId.set(r.id, { id: r.id, name: r.name, code: r.code, parentCode: null, children: [] });
            for (const r of rows) {
                const n = byId.get(r.id);
                if (r.parent_id) {
                    const p = byId.get(r.parent_id);
                    if (p) {
                        n.parentCode = p.code;
                        p.children.push(n);
                    }
                    else {
                        roots.push(n);
                    }
                }
                else {
                    roots.push(n);
                }
            }
            res.json(roots);
        }
        catch (e) {
            res.status(500).json({ error: 'failed_to_load_categories' });
        }
    }
}
exports.CategoryControllerImpl = CategoryControllerImpl;
