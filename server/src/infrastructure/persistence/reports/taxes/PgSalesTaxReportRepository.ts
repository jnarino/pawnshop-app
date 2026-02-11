import { Pool } from 'pg';
import { SalesTaxRecord } from '../../../../domains/reports/taxes/SalesTaxRecord';
import { SalesTaxReportRepository } from '../../../../domains/reports/taxes/SalesTaxReportRepository';
import { loadSql } from '../../../db/sqlLoader';

const sqlSalesTaxesReport = loadSql('queries', 'reports/taxes/sales_taxes_report');

export class PgSalesTaxReportRepository implements SalesTaxReportRepository {
  constructor(private readonly pool: Pool) { }

  async findByDateRange(startDate: Date, endDate: Date): Promise<SalesTaxRecord[]> {
    const result = await this.pool.query(sqlSalesTaxesReport, [startDate, endDate]);

    return result.rows.map((row) => new SalesTaxRecord({
      occurredAt: new Date(row.occurred_at),
      type: row.transaction_type,
      ticketNumber: row.ticket_number,
      grossAmount: Number(row.gross_amount ?? 0),
      taxableAmount: Number(row.taxable_amount ?? 0),
      taxCollected: Number(row.tax_collected ?? 0),
    }));
  }
}
