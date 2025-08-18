"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryStatusRepository = void 0;
const db_1 = require("../db");
const sqlLoader_1 = require("../db/sqlLoader");
class InventoryStatusRepository {
    async list() {
        const sql = (0, sqlLoader_1.getSQL)('query', 'inventory', 'listStatuses');
        const { rows } = await db_1.pool.query(sql);
        return rows.map(r => ({
            code: r.code,
            description: r.description ?? undefined,
            isTerminal: r.is_terminal,
            sortOrder: r.sort_order,
            active: r.active,
        }));
    }
    async find(code) {
        const sql = (0, sqlLoader_1.getSQL)('query', 'inventory', 'findStatusByCode');
        const { rows } = await db_1.pool.query(sql, [code]);
        const r = rows[0];
        if (!r)
            return null;
        return {
            code: r.code,
            description: r.description ?? undefined,
            isTerminal: r.is_terminal,
            sortOrder: r.sort_order,
            active: r.active,
        };
    }
    async insert(input) {
        await db_1.pool.query(`INSERT INTO inventory_item_status(code, description, is_terminal, sort_order, active)
       VALUES ($1,$2,$3,$4,true)`, [input.code, input.description ?? null, input.isTerminal, input.sortOrder]);
    }
    async deactivate(code) {
        await db_1.pool.query(`UPDATE inventory_item_status SET active = false, updated_at = now() WHERE code = $1`, [code]);
    }
}
exports.InventoryStatusRepository = InventoryStatusRepository;
