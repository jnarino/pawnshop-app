import { Pool } from 'pg';
import { ActivePawnRecord } from '../../../../domains/reports/pawn/ActivePawnRecord';
import { ActivePawnReportRepository, FindActivePawnsCriteria } from '../../../../domains/reports/pawn/ActivePawnReportRepository';
import { loadSql } from '../../../db/sqlLoader';

const sqlActivePawns = loadSql('queries', 'reports/pawn/active_pawns_report');

export class PgActivePawnReportRepository implements ActivePawnReportRepository {
  constructor(private readonly pool: Pool) {}

  async findActive(criteria: FindActivePawnsCriteria): Promise<ActivePawnRecord[]> {
    const result = await this.pool.query(sqlActivePawns, [
      criteria.categoryId ?? null,
      criteria.subcategoryId ?? null,
      criteria.excludeJewelryAndFirearm ?? false,
    ]);
    return result.rows.map((row: any) => new ActivePawnRecord({
      pawnTicketId: row.pawn_ticket_id,
      ticketNumber: row.ticket_number,
      customerName: row.customer_name,
      employeeUsername: row.employee_username,
      dateIn: row.date_in,
      dateOut: row.date_out,
      serviceChargeDue: Number(row.service_charge_due ?? 0),
      itemAmount: Number(row.item_amount ?? 0),
      quantity: Number(row.quantity ?? 0),
      itemDescription: row.item_description,
      status: row.status,
      brand: row.brand ?? null,
      model: row.model ?? null,
      serialNumber: row.serial_number ?? null,
      extra: row.extra ?? {},
      attributes: row.attributes ?? {},
    }));
  }
}
