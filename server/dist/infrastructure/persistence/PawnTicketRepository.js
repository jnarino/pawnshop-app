"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PawnTicketRepository = void 0;
const db_1 = require("../db");
const sqlLoader_1 = require("../db/sqlLoader");
const PawnTicket_1 = require("../../domain/pawnTicket/PawnTicket");
class PawnTicketRepository {
    async update(id, dto) {
        // Only allow updating specific fields here
        const sets = [];
        const params = [];
        let i = 1;
        if (typeof dto.pawnStatus !== 'undefined') {
            sets.push(`pawn_status = $${i++}`);
            params.push(dto.pawnStatus);
        }
        if (typeof dto.maturityDate !== 'undefined') {
            sets.push(`maturity_date = $${i++}`);
            params.push(dto.maturityDate);
        }
        if (typeof dto.defaultDate !== 'undefined') {
            sets.push(`default_date = $${i++}`);
            params.push(dto.defaultDate);
        }
        if (sets.length === 0)
            return false;
        // optional updated_at touch
        sets.push(`updated_at = NOW()`);
        params.push(id);
        const sql = `UPDATE pawn_tickets SET ${sets.join(', ')} WHERE id = $${i}`;
        const res = await db_1.pool.query(sql, params);
        return res.rowCount === 1;
    }
    async findAll(limit, offset, filters) {
        const baseRaw = (0, sqlLoader_1.getSQL)('query', 'pawnTicket', 'findAllPawnTickets'); // may end with semicolon
        const base = baseRaw.replace(/;\s*$/, '');
        const where = [];
        const params = [];
        if (filters?.customerId) {
            params.push(filters.customerId);
            where.push(`customer_id = $${params.length}`);
        }
        if (filters?.pawnStatus) {
            params.push(filters.pawnStatus);
            where.push(`pawn_status = $${params.length}`);
        }
        let sql = base;
        if (where.length) {
            // Insert WHERE before ORDER BY (base query ends with ORDER BY transaction_date DESC)
            const idx = sql.toUpperCase().lastIndexOf('ORDER BY');
            if (idx !== -1) {
                const before = sql.substring(0, idx).trimEnd();
                const order = sql.substring(idx);
                sql = `${before} WHERE ${where.join(' AND ')}\n${order}`;
            }
            else {
                sql = `${sql} WHERE ${where.join(' AND ')}`;
            }
        }
        // Pagination
        if (typeof limit === 'number') {
            params.push(limit);
            sql += `\nLIMIT $${params.length}`;
        }
        if (typeof offset === 'number') {
            params.push(offset);
            sql += `\nOFFSET $${params.length}`;
        }
        const { rows } = await db_1.pool.query(sql, params);
        return rows.map(r => ({
            id: r.id,
            controlNumber: r.controlNumber ?? undefined,
            type: r.type,
            customerId: r.customerId,
            pawnStatus: r.pawnStatus,
            inventoryItemIds: r.inventoryItemIds || [],
            amountFinanced: r.amountFinanced !== null ? Number(r.amountFinanced) : null,
            financeCharge: r.financeCharge !== null ? Number(r.financeCharge) : null,
            periodicRate: r.periodicRate !== null ? Number(r.periodicRate) : null,
            totalOfPayments: r.totalOfPayments !== null ? Number(r.totalOfPayments) : null,
            annualPercentageRate: r.annualPercentageRate !== null ? Number(r.annualPercentageRate) : null,
            purchaseTradeValue: r.purchaseTradeValue !== null ? Number(r.purchaseTradeValue) : null,
            transactionDate: r.transactionDate,
            maturityDate: r.maturityDate,
            defaultDate: r.defaultDate,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        }));
    }
    async create(input) {
        // Build domain first to compute derived fields
        const tempId = '00000000-0000-0000-0000-000000000000'; // placeholder; DB will generate real id
        const now = new Date();
        const domain = (0, PawnTicket_1.buildPawnTicket)(tempId, input, now);
        const sql = (0, sqlLoader_1.getSQL)('command', 'pawnTicket', 'createPawnTicket');
        const params = [
            domain.controlNumber ?? null,
            domain.type,
            domain.customerId,
            domain.pawnStatus,
            domain.amountFinanced,
            domain.financeCharge,
            domain.periodicRate,
            domain.totalOfPayments,
            domain.annualPercentageRate,
            domain.purchaseTradeValue,
            domain.transactionDate,
            domain.maturityDate,
            domain.defaultDate,
        ];
        const { rows } = await db_1.pool.query(sql, params);
        const id = rows[0].id;
        if (domain.inventoryItemIds.length) {
            const addItems = (0, sqlLoader_1.getSQL)('command', 'pawnTicket', 'addPawnTicketItems');
            await db_1.pool.query(addItems, [id, domain.inventoryItemIds]);
            // inventory numbers should be supplied at inventory item creation time now
        }
        return id;
    }
    async findById(id) {
        const sql = (0, sqlLoader_1.getSQL)('query', 'pawnTicket', 'findPawnTicketWithItems');
        const { rows } = await db_1.pool.query(sql, [id]);
        const r = rows[0];
        if (!r)
            return null;
        return {
            id: r.id,
            controlNumber: r.controlNumber ?? undefined,
            type: r.type,
            customerId: r.customerId,
            pawnStatus: r.pawnStatus,
            inventoryItemIds: r.inventoryItemIds || [],
            amountFinanced: r.amountFinanced !== null ? Number(r.amountFinanced) : null,
            financeCharge: r.financeCharge !== null ? Number(r.financeCharge) : null,
            periodicRate: r.periodicRate !== null ? Number(r.periodicRate) : null,
            totalOfPayments: r.totalOfPayments !== null ? Number(r.totalOfPayments) : null,
            annualPercentageRate: r.annualPercentageRate !== null ? Number(r.annualPercentageRate) : null,
            purchaseTradeValue: r.purchaseTradeValue !== null ? Number(r.purchaseTradeValue) : null,
            transactionDate: r.transactionDate,
            maturityDate: r.maturityDate,
            defaultDate: r.defaultDate,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        };
    }
    async search(opts) {
        const sql = (0, sqlLoader_1.getSQL)('query', 'pawnTicket', 'searchPawnTickets');
        const params = [
            opts.customerId ?? null,
            opts.type ?? null,
            opts.startDate ?? null,
            opts.endDate ?? null,
            opts.limit ?? 50,
            opts.offset ?? 0,
        ];
        const { rows } = await db_1.pool.query(sql, params);
        return rows.map(r => ({
            id: r.id,
            controlNumber: r.controlNumber ?? undefined,
            type: r.type,
            customerId: r.customerId,
            pawnStatus: r.pawnStatus,
            inventoryItemIds: [], // not loaded in search list for performance
            amountFinanced: r.amountFinanced !== null ? Number(r.amountFinanced) : null,
            financeCharge: r.financeCharge !== null ? Number(r.financeCharge) : null,
            periodicRate: r.periodicRate !== null ? Number(r.periodicRate) : null,
            totalOfPayments: r.totalOfPayments !== null ? Number(r.totalOfPayments) : null,
            annualPercentageRate: r.annualPercentageRate !== null ? Number(r.annualPercentageRate) : null,
            purchaseTradeValue: r.purchaseTradeValue !== null ? Number(r.purchaseTradeValue) : null,
            transactionDate: r.transactionDate,
            maturityDate: r.maturityDate,
            defaultDate: r.defaultDate,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    }
    async updateDates(id, maturityDate, defaultDate) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'pawnTicket', 'updatePawnTicket');
        const params = [id, null, maturityDate, defaultDate];
        const res = await db_1.pool.query(sql, params);
        return res.rowCount === 1;
    }
    async delete(id) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'pawnTicket', 'deletePawnTicket');
        const res = await db_1.pool.query(sql, [id]);
        return res.rowCount === 1;
    }
}
exports.PawnTicketRepository = PawnTicketRepository;
