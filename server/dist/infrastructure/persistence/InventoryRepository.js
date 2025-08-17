"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryRepository = void 0;
exports.mapRowToInventoryItem = mapRowToInventoryItem;
const db_1 = require("../db");
const sqlLoader_1 = require("../db/sqlLoader");
// Mapping is handled mostly by SQL aliases. Just ensure numeric/JSON fields are normalized.
// Exported for testing (mapping tests)
function mapRowToInventoryItem(r) {
    return {
        id: typeof r.id === 'number' ? String(r.id) : r.id,
        type: r.type,
        status: r.status,
        categoryId: r.categoryId ?? undefined,
        subcategoryId: r.subcategoryId ?? undefined,
        brand: r.brand ?? undefined,
        model: r.model ?? undefined,
        serialNumber: r.serialNumber ?? undefined,
        color: r.color ?? undefined,
        itemCondition: r.itemCondition ?? undefined,
        quantity: r.quantity,
        amount: r.amount !== null ? Number(r.amount) : undefined,
        resale: r.resale !== null ? Number(r.resale) : undefined,
        itemReplace: r.itemReplace !== null ? Number(r.itemReplace) : undefined,
        bin: r.bin ?? undefined,
        ownerTag: r.ownerTag ?? undefined,
        itemDescription: r.itemDescription ?? undefined,
        firearm: r.firearm ?? undefined,
        jewelry: r.jewelry ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}
class InventoryRepository {
    async create(dto) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'inventory', 'createInventoryItem');
        const params = [
            dto.type, // maps to inventory_item_type
            dto.status ?? 'in_inventory',
            dto.categoryId,
            dto.subcategoryId,
            dto.brand,
            dto.model,
            dto.serialNumber,
            dto.color,
            dto.itemCondition,
            dto.quantity,
            dto.amount,
            dto.resale,
            dto.itemReplace,
            dto.bin,
            dto.ownerTag,
            dto.itemDescription,
            dto.firearm ? JSON.stringify(dto.firearm) : null,
            dto.jewelry ? JSON.stringify(dto.jewelry) : null,
        ];
        const { rows } = await db_1.pool.query(sql, params);
        return rows[0].id;
    }
    async findById(id) {
        const sql = (0, sqlLoader_1.getSQL)('query', 'inventory', 'findInventoryItemById');
        const { rows } = await db_1.pool.query(sql, [id]);
        if (!rows[0])
            return null;
        return mapRowToInventoryItem(rows[0]);
    }
    async findAll(limit, offset) {
        const base = (0, sqlLoader_1.getSQL)('query', 'inventory', 'findAllInventoryItems');
        const clauses = [];
        const params = [];
        if (typeof limit === 'number') {
            params.push(limit);
            clauses.push(`LIMIT $${params.length}`);
        }
        if (typeof offset === 'number') {
            params.push(offset);
            clauses.push(`OFFSET $${params.length}`);
        }
        const sql = `${base} ${clauses.join(' ')}`.trim();
        const { rows } = await db_1.pool.query(sql, params);
        return rows.map(mapRowToInventoryItem);
    }
    async update(id, dto) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'inventory', 'updateInventoryItem');
        const serialize = (val) => {
            if (val === null)
                return null; // explicit clear
            if (val === undefined)
                return undefined; // ignore (COALESCE/CASE will skip because param is undefined -> treated as NULL? we differentiate by building text)
            return JSON.stringify(val);
        };
        const params = [
            dto.type, // inventory_item_type
            dto.status,
            dto.categoryId,
            dto.subcategoryId,
            dto.brand,
            dto.model,
            dto.serialNumber,
            dto.color,
            dto.itemCondition,
            dto.quantity,
            dto.amount,
            dto.resale,
            dto.itemReplace,
            dto.bin,
            dto.ownerTag,
            dto.itemDescription,
            serialize(dto.firearm),
            serialize(dto.jewelry),
            id,
        ];
        const res = await db_1.pool.query(sql, params);
        return res.rowCount === 1;
    }
    async delete(id) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'inventory', 'deleteInventoryItem');
        const res = await db_1.pool.query(sql, [id]);
        return res.rowCount === 1;
    }
}
exports.InventoryRepository = InventoryRepository;
