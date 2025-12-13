import { Pool, PoolClient } from 'pg';
import { PawnTicketPayment } from '../../../domains/pawnTicketPayment/PawnTicketPayment';
import { PawnTicketPaymentRepository } from '../../../domains/pawnTicketPayment/PawnTicketPaymentRepository';
import { loadSql } from '../../db/sqlLoader';

type DbClient = Pool | PoolClient;

const SQL_FIND_BY_TICKET = loadSql('queries', 'pawnTicketPayment/pawn_ticket_payment_find_by_ticket');

function mapRowToPayment(row: any): PawnTicketPayment {
  return new PawnTicketPayment({
    pawnTicketId: row.pawn_ticket_id,
    paymentDate: new Date(row.payment_date),
    principalPaid: row.principal_paid !== null ? Number(row.principal_paid) : 0,
    clerkUserId: row.clerk_user_id || null
  });
}

export class PgPawnTicketPaymentRepository implements PawnTicketPaymentRepository {
  constructor(private readonly db: DbClient) {}

  async findByPawnTicketId(pawnTicketId: string): Promise<PawnTicketPayment[]> {
    const result = await this.db.query(SQL_FIND_BY_TICKET, [pawnTicketId]);
    return result.rows.map(mapRowToPayment);
  }
}
