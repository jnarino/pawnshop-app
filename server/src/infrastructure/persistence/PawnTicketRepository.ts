import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { PawnTicket, buildPawnTicket, CreatePawnTicketInput } from '../../domain/pawnTicket/PawnTicket';

export class PawnTicketRepository {
  async create(input: CreatePawnTicketInput): Promise<string> {
    // Build domain first to compute derived fields
    const tempId = '00000000-0000-0000-0000-000000000000'; // placeholder; DB will generate real id
    const now = new Date();
    const domain = buildPawnTicket(tempId, input, now);
    const sql = getSQL('command','pawnTicket','createPawnTicket');
    const params = [
      domain.controlNumber ?? null,
      domain.type,
      domain.customerId,
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
    const { rows } = await pool.query(sql, params);
    const id = rows[0].id;
    if (domain.inventoryItemIds.length) {
      const addItems = getSQL('command','pawnTicket','addPawnTicketItems');
      await pool.query(addItems, [id, domain.inventoryItemIds]);
      // inventory numbers should be supplied at inventory item creation time now
    }
    return id;
  }

  async findById(id: string): Promise<PawnTicket | null> {
    const sql = getSQL('query','pawnTicket','findPawnTicketWithItems');
    const { rows } = await pool.query(sql,[id]);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      controlNumber: r.controlNumber ?? undefined,
      type: r.type,
      customerId: r.customerId,
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

  async search(opts: { customerId?: string; type?: string; startDate?: string; endDate?: string; limit?: number; offset?: number; }): Promise<PawnTicket[]> {
    const sql = getSQL('query','pawnTicket','searchPawnTickets');
    const params = [
      opts.customerId ?? null,
      opts.type ?? null,
      opts.startDate ?? null,
      opts.endDate ?? null,
      opts.limit ?? 50,
      opts.offset ?? 0,
    ];
    const { rows } = await pool.query(sql, params);
    return rows.map(r => ({
      id: r.id,
      controlNumber: r.controlNumber ?? undefined,
      type: r.type,
      customerId: r.customerId,
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

  async updateDates(id: string, maturityDate?: string, defaultDate?: string): Promise<boolean> {
    const sql = getSQL('command','pawnTicket','updatePawnTicket');
    const params = [id, null, maturityDate, defaultDate];
    const res = await pool.query(sql, params);
    return res.rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const sql = getSQL('command','pawnTicket','deletePawnTicket');
    const res = await pool.query(sql,[id]);
    return res.rowCount === 1;
  }
}
