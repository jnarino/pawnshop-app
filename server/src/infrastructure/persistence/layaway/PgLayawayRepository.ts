import { Pool } from 'pg';
import { LayawayAgreement, LayawayAgreementProps } from '../../../domains/layaway/LayawayAgreement';
import { LayawayRepository, FindLayawaysCriteria } from '../../../domains/layaway/LayawayRepository';
import { loadSql } from '../../db/sqlLoader';

const sqlFindByCriteria = loadSql('queries', 'layaway/layaway_find_by_criteria');

export class PgLayawayRepository implements LayawayRepository {
  constructor(private readonly pool: Pool) {}

  async findByCriteria(criteria: FindLayawaysCriteria): Promise<LayawayAgreement[]> {
    const { status, startDate, endDate } = criteria;

    const result = await this.pool.query(sqlFindByCriteria, [
      status || null,
      startDate || null,
      endDate || null,
    ]);

    return result.rows.map(this.mapRow);
  }

  private mapRow(row: any): LayawayAgreement {
    return new LayawayAgreement({
      id: row.id,
      ticketnum: row.ticketnum,
      clerkUserId: row.clerk_user_id,
      dateIn: row.date_in,
      lastUpdatedAt: row.last_updated_at,
      amount: row.amount ? Number(row.amount) : null,
      taxSales: row.tax_sales ? Number(row.tax_sales) : null,
      stateTax: row.state_tax ? Number(row.state_tax) : null,
      returnedAmt: row.returned_amt ? Number(row.returned_amt) : null,
      customerId: row.customer_id,
      note: row.note,
      status: row.status,
      defaultDate: row.default_date,
      totalOfPayments: row.total_of_payments ? Number(row.total_of_payments) : null,
      period: row.period,
      extraNote: row.extra_note,
      gunProcFee: row.gun_proc_fee ? Number(row.gun_proc_fee) : null,
      lastUpdatedUserId: row.last_updated_user_id,
      inventoryNumber: row.inventory_number,
      numberSold: row.number_sold,
      itemAmount: row.item_amount ? Number(row.item_amount) : null,
      description: row.description,
      taxExempt: row.tax_exempt,
      returnSold: row.return_sold,
      itemStatus: row.item_status,
      countyTaxExempt: row.county_tax_exempt,
      itemLastUpdatedUserId: row.item_last_updated_user_id,
      itemsId: row.items_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
