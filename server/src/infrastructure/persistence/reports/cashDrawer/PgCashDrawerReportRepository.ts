import { Pool } from 'pg';
import { CashDrawerRecord } from '../../../../domains/reports/cashDrawer/CashDrawerRecord';
import { CashDrawerReportRepository } from '../../../../domains/reports/cashDrawer/CashDrawerReportRepository';
import { loadSql } from '../../../db/sqlLoader';

const sqlLastClose = loadSql('queries', 'reports/cashDrawer/cash_drawer_last_close');
const sqlCashDrawerDetail = loadSql('queries', 'reports/cashDrawer/cash_drawer_detail');

export class PgCashDrawerReportRepository implements CashDrawerReportRepository {
    constructor(private readonly pool: Pool) { }

    async getLastClose(startDate: Date): Promise<{ amount: number; occurredAt: Date } | null> {
        const lastCloseResult = await this.pool.query(sqlLastClose, [startDate]);
        if (!lastCloseResult.rows.length) return null;
        const row = lastCloseResult.rows[0];
        return {
            amount: Number(row.amount ?? 0),
            occurredAt: new Date(row.occurred_at),
        };
    }


    async findByDateRange(startDate: Date, endDate: Date): Promise<CashDrawerRecord[]> {
        const result = await this.pool.query(sqlCashDrawerDetail, [startDate, endDate]);

        return result.rows.map((row) => new CashDrawerRecord({
            occurredAt: new Date(row.occurred_at),
            ticketNumber: row.legacy_ticketnum,
            employee: row.employee,
            transactionType: row.transaction_type,
            transactionCode: row.transaction_code,
            amount: Number(row.amount ?? 0),
            tenderAmount: Number(row.tender_amount ?? 0),
            tenderChange: Number(row.tender_change ?? 0),
            remarks: row.remarks,
            paymentMethod: row.payment_method,
            balance: 0, // Will be calculated in use case
            principalComponent: row.principal_component ? Number(row.principal_component) : undefined,
            interestComponent: row.interest_component ? Number(row.interest_component) : undefined,
        }));
    }
}
