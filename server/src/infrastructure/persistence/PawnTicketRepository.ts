import { getSQL } from '../db/sqlLoader';
import { PawnTicket, CreatePawnTicketInput, buildPawnTicket } from '../../domain/pawnTicket/PawnTicket';
import type { PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { IPawnTicketRepository, CreatePawnTicketPaymentInput } from '../../domain/pawnTicket/IPawnTicketRepository';
import { pool } from '../db';

export class PawnTicketRepository implements IPawnTicketRepository {
  async create(input: CreatePawnTicketInput): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticketId = uuidv4();
      const ticket = buildPawnTicket(ticketId, input, new Date());
      await this.createInTransaction(client, ticket);
      await client.query('COMMIT');
      return ticketId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createInTransaction(client: PoolClient, ticket: PawnTicket): Promise<string> {
    const createSQL = getSQL('command', 'pawnTicket', 'createPawnTicket');
    await client.query(createSQL, [
      ticket.id,                    // $1 - id
      ticket.controlNumber,         // $2 - control_number
      ticket.type,                  // $3 - transaction_type
      ticket.customerId,           // $4 - customer_id
      ticket.amountFinanced,       // $5 - amount_financed
      ticket.financeCharge,        // $6 - finance_charge
      ticket.periodicRate,         // $7 - periodic_rate
      ticket.totalOfPayments,      // $8 - total_of_payments
      ticket.annualPercentageRate, // $9 - apr
      ticket.purchaseTradeValue,   // $10 - purchase_trade_value
      ticket.transactionDate,      // $11 - transaction_date
      ticket.maturityDate,         // $12 - maturity_date
      ticket.defaultDate,          // $13 - default_date
      ticket.ratePlanId,           // $14 - rate_plan_id
      ticket.paidThroughDate,      // $15 - paid_through_date
      ticket.nextChargeDate,       // $16 - next_charge_date
      ticket.interestCredit,       // $17 - interest_credit
      ticket.pawnStatus,           // $18 - pawn_status
      ticket.lastActivityAt || ticket.transactionDate, // $19 - last_activity_at
      ticket.createdAt,            // $20 - created_at
      ticket.updatedAt,            // $21 - updated_at
    ]);

    // Link inventory items
    if (ticket.inventoryItemIds.length > 0) {
      const linkSQL = getSQL('command', 'pawnTicket', 'linkPawnTicketItem');
      for (const itemId of ticket.inventoryItemIds) {
        await client.query(linkSQL, [ticket.id, itemId]);
      }
    }

    return ticket.id;
  }

  async createPawnTicketPayment(client: PoolClient, input: CreatePawnTicketPaymentInput): Promise<string> {
    const sql = getSQL('command', 'pawnTicket', 'createPawnTicketPayment');
    const paymentId = uuidv4();

    await client.query(sql, [
      paymentId,                    // $1 - id
      input.pawnTicketId,          // $2 - pawn_ticket_id
      input.storeTransactionId,    // $3 - store_transaction_id
      input.paymentDate,           // $4 - payment_date
      input.interestPaid,          // $5 - interest_paid
      input.principalPaid,         // $6 - principal_paid (can be negative)
      input.feesPaid,              // $7 - fees_paid
      input.clerkUserId,           // $8 - clerk_user_id
      input.note                   // $9 - note
    ]);

    return paymentId;
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
    const finalSql = `UPDATE pawn_ticket SET ${sets.join(', ')} WHERE id = $${i}`;
    const res = await pool.query(finalSql, params);
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

  async findByControlNumberWithPayments(controlNumber: string): Promise<any | null> {
    const sql = getSQL('query', 'pawnTicket', 'findPawnTicketWithPayments');
    const { rows } = await pool.query(sql, [controlNumber]);
    const r = rows[0];
    if (!r) return null;

    return {
      ...this.mapRowToPawnTicket(r),
      payments: r.payments || []
    };
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

  async getNextControlNumber(): Promise<string> {
    const sql = getSQL('query', 'pawnTicket', 'getNextControlNumber');
    const { rows } = await pool.query<{ control_number: string }>(sql);
    return rows[0].control_number;
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
      ratePlanId: r.rate_plan_id ?? null,
      paidThroughDate: r.paid_through_date ?? null,
      nextChargeDate: r.next_charge_date ?? null,
      interestCredit: r.interest_credit ? Number(r.interest_credit) : 0,
      lastPaymentAt: r.last_payment_at ?? null,
      lastActivityAt: r.last_activity_at ?? null,
      defaultMarkedAt: r.default_marked_at ?? null,
      defaultMarkedBy: r.default_marked_by ?? null,
      defaultReason: r.default_reason ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
