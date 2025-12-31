import { Pool } from 'pg';
import { CashDrawerRecord } from '../../../../domains/reports/cashDrawer/CashDrawerRecord';
import { CashDrawerReportRepository } from '../../../../domains/reports/cashDrawer/CashDrawerReportRepository';
import { loadSql } from '../../../db/sqlLoader';

const sqlCashDrawerDetail = loadSql('queries', 'reports/cashDrawer/cash_drawer_detail');

export class PgCashDrawerReportRepository implements CashDrawerReportRepository {
  constructor(private readonly pool: Pool) { }

  async findByDateRange(startDate: Date, endDate: Date): Promise<CashDrawerRecord[]> {
    const result = await this.pool.query(sqlCashDrawerDetail, [startDate, endDate]);

    return result.rows.map((row) => new CashDrawerRecord({
      occurredAt: row.occurred_at,
      ticketNumber: row.legacy_ticketnum,
      employee: row.employee,
      transactionType: row.transaction_type,
      amount: Number(row.amount ?? 0),
      tenderChange: Number(row.tender_change ?? 0),
      remarks: row.remarks,
      paymentMethod: row.payment_method,
      balance: Number(row.balance ?? 0),
    }));
  }
}
