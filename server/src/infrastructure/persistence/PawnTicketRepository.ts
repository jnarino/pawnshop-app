import { getSQL } from '../db/sqlLoader';
import { pool } from '../db';
import { PawnTicket, CreatePawnTicketInput, buildPawnTicket } from '../../domain/pawnTicket/PawnTicket';
import type { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { IPawnTicketRepository } from '../../domain/pawnTicket/IPawnTicketRepository';

export class PawnTicketRepository implements IPawnTicketRepository {
  // ✅ Standalone: Creates ticket with own transaction
  async createSingleTicket(input: CreatePawnTicketInput): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticketId = await this.createInTransaction(client, input);
      await client.query('COMMIT');
      return ticketId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ✅ Transactional: Part of larger transaction
  async createInTransaction(client: PoolClient, input: CreatePawnTicketInput): Promise<string> {
    const ticketId = uuidv4();
    const ticket = buildPawnTicket(ticketId, input, new Date());

    const createSQL = getSQL('command', 'pawnTicket', 'createPawnTicket');
    await client.query(createSQL, [
      ticket.id,
      ticket.controlNumber,
      ticket.type,
      ticket.customerId,
      ticket.amountFinanced,
      ticket.financeCharge,
      ticket.periodicRate,
      ticket.totalOfPayments,
      ticket.annualPercentageRate,
      ticket.purchaseTradeValue,
      ticket.transactionDate,
      ticket.maturityDate,
      ticket.defaultDate,
      ticket.pawnStatus,
    ]);

    if (ticket.inventoryItemIds.length > 0) {
      const linkSQL = getSQL('command', 'pawnTicket', 'linkPawnTicketItem');
      for (const itemId of ticket.inventoryItemIds) {
        await client.query(linkSQL, [ticket.id, itemId]);
      }
    }

    return ticketId;
  }

  async update(id: string, dto: Partial<PawnTicket>): Promise<boolean> {
    const sets: string[] = [];
    const params: any[] = [];
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

    if (sets.length === 0) return false;

    sets.push(`updated_at = NOW()`);
    params.push(id);
    const sql = `UPDATE pawn_ticket SET ${sets.join(', ')} WHERE id = $${i}`;
    const res = await pool.query(sql, params);
    return res.rowCount === 1;
  }

  async findAll(
    limit?: number,
    offset?: number,
    filters?: { customerId?: string; pawnStatus?: PawnTicket['pawnStatus'] }
  ): Promise<PawnTicket[]> {
    const baseRaw = getSQL('query', 'pawnTicket', 'findAllPawnTickets'); // may end with semicolon
    const base = baseRaw.replace(/;\s*$/, '');
    const where: string[] = [];
    const params: any[] = [];

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
      } else {
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

    const { rows } = await pool.query(sql, params);
    return rows.map(r => this.mapRowToPawnTicket(r));
  }

  async findById(id: string): Promise<PawnTicket | null> {
    const sql = getSQL('query', 'pawnTicket', 'findPawnTicketWithItems');
    const { rows } = await pool.query(sql, [id]);
    const r = rows[0];
    if (!r) return null;
    return this.mapRowToPawnTicket(r);
  }

  async search(opts: {
    customerId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<PawnTicket[]> {
    const sql = getSQL('query', 'pawnTicket', 'searchPawnTickets');
    const params = [
      opts.customerId ?? null,
      opts.type ?? null,
      opts.startDate ?? null,
      opts.endDate ?? null,
      opts.limit ?? 50,
      opts.offset ?? 0,
    ];
    const { rows } = await pool.query(sql, params);
    return rows.map(r => this.mapRowToPawnTicket(r, false));
  }

  async updateDates(id: string, maturityDate?: string, defaultDate?: string): Promise<boolean> {
    const sql = getSQL('command', 'pawnTicket', 'updatePawnTicket');
    const params = [id, null, maturityDate, defaultDate];
    const res = await pool.query(sql, params);
    return res.rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const sql = getSQL('command', 'pawnTicket', 'deletePawnTicket');
    const res = await pool.query(sql, [id]);
    return res.rowCount === 1;
  }

  private mapRowToPawnTicket(r: any, includeItems = true): PawnTicket {
    return {
      id: r.id,
      controlNumber: r.control_number ?? undefined,
      type: r.transaction_type,
      customerId: r.customer_id,
      pawnStatus: r.pawn_status,
      inventoryItemIds: includeItems ? (r.inventory_item_ids || []) : [],
      amountFinanced: r.amount_financed !== null ? Number(r.amount_financed) : null,
      financeCharge: r.finance_charge !== null ? Number(r.finance_charge) : null,
      periodicRate: r.periodic_rate !== null ? Number(r.periodic_rate) : null,
      totalOfPayments: r.total_of_payments !== null ? Number(r.total_of_payments) : null,
      annualPercentageRate: r.apr !== null ? Number(r.apr) : null,
      purchaseTradeValue: r.purchase_trade_value !== null ? Number(r.purchase_trade_value) : null,
      transactionDate: r.transaction_date,
      maturityDate: r.maturity_date,
      defaultDate: r.default_date,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
