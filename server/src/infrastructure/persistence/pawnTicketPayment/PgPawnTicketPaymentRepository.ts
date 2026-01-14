import { Pool, PoolClient } from 'pg';
import { PawnTicketPayment } from '../../../domains/pawnTicketPayment/PawnTicketPayment';
import { PawnTicketPaymentRepository } from '../../../domains/pawnTicketPayment/PawnTicketPaymentRepository';
import { loadSql } from '../../db/sqlLoader';

type DbClient = Pool | PoolClient;

const SQL_FIND_BY_TICKET = loadSql('queries', 'pawnTicketPayment/pawn_ticket_payment_find_by_ticket');

function mapRowToPayment(row: any): PawnTicketPayment {
  return new PawnTicketPayment({
    pawnTicketId: row.id,
    paymentDate: new Date(row.occurred_at),
    principalPaid: row.amount !== null ? Number(row.amount) : 0,
    clerkUserId: row.username || null,
    transactionTypeName: row.type_name || ''
  });
}

export class PgPawnTicketPaymentRepository implements PawnTicketPaymentRepository {
  constructor(private readonly db: DbClient) {}

  async findByPawnTicketId(pawnTicketId: string): Promise<PawnTicketPayment[]> {
    const result = await this.db.query(SQL_FIND_BY_TICKET, [pawnTicketId]);
    return result.rows.map(mapRowToPayment);
  }
}
