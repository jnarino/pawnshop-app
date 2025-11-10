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
    const sql = getSQL('command', 'pawnTicket', 'updatePawnTicket');
    const params = [id, dto.pawnStatus, dto.maturityDate, dto.defaultDate];
    const res = await pool.query(sql, params);
    return res.rowCount === 1;
  }

  async findAll(limit = 50, offset = 0, filters?: {
    customerId?: string;
    pawnStatus?: string;
  }): Promise<any[]> {
    const sql = getSQL('query', 'pawnTicket', 'findAllPawnTickets');
    const params = [
      filters?.customerId ?? null,
      filters?.pawnStatus ?? null,
      limit,
      offset
    ];

    const result = await pool.query(sql, params);
    return result.rows;
  }

  async findById(id: string): Promise<any | null> {
    const sql = getSQL('query', 'pawnTicket', 'findPawnTicketById');
    const result = await pool.query(sql, [id]);
    return result.rows[0] || null;
  }

  async findByControlNumberWithPayments(controlNumber: string): Promise<any | null> {
    const sql = getSQL('query', 'pawnTicket', 'findPawnTicketWithPayments');
    const result = await pool.query(sql, [controlNumber]);
    return result.rows[0] || null;
  }

  async search(filters: {
    controlNumber?: string;
    customerId?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }, limit = 50, offset = 0): Promise<any[]> {
    const sql = getSQL('query', 'pawnTicket', 'searchPawnTickets');
    const params = [
      filters.controlNumber ?? null,
      filters.customerId ?? null,
      filters.status ?? null,
      filters.type ?? null,
      filters.dateFrom ?? null,
      filters.dateTo ?? null,
      limit,
      offset
    ];

    const result = await pool.query(sql, params);
    return result.rows;
  }

  async updateDates(id: string, maturityDate?: string, defaultDate?: string): Promise<boolean> {
    const sql = getSQL('command', 'pawnTicket', 'updatePawnTicketDates');
    const params = [id, maturityDate ?? null, defaultDate ?? null];
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
}
