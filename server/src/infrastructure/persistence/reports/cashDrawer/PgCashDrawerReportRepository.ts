import { Pool } from 'pg';
import { CashDrawerRecord } from '../../../../domains/reports/cashDrawer/CashDrawerRecord';
import { CashDrawerReportRepository } from '../../../../domains/reports/cashDrawer/CashDrawerReportRepository';
import { loadSql } from '../../../db/sqlLoader';

const sqlLastClose = loadSql('queries', 'reports/cashDrawer/cash_drawer_last_close');
const sqlBalanceAccumulation = loadSql('queries', 'reports/cashDrawer/cash_drawer_balance_accumulation');
const sqlCashDrawerDetail = loadSql('queries', 'reports/cashDrawer/cash_drawer_detail');

export class PgCashDrawerReportRepository implements CashDrawerReportRepository {
    constructor(private readonly pool: Pool) { }

    async getOpeningBalance(startDate: Date): Promise<number> {
        // Find the last MAIN BALANCE (MB) transaction before this date
        const lastCloseResult = await this.pool.query(sqlLastClose, [startDate]);
        
        if (!lastCloseResult.rows.length) {
            // No previous close found, opening balance is 0
            return 0;
        }

        const lastClose = lastCloseResult.rows[0];
        const closingBalance = Number(lastClose.amount ?? 0);
        const lastCloseDate = new Date(lastClose.occurred_at);

        // Calculate days passed since last close
        const daysPassed = Math.floor((startDate.getTime() - lastCloseDate.getTime()) / (1000 * 60 * 60 * 24));

        // If more than 1 day has passed, accumulate transactions between close and report start
        if (daysPassed > 1) {
            const accumulationResult = await this.pool.query(sqlBalanceAccumulation, [lastCloseDate, startDate]);
            
            let accumulatedBalance = closingBalance;
            for (const row of accumulationResult.rows) {
                // Only count amount on first tender of each transaction
                accumulatedBalance += Number(row.amount ?? 0);
            }

            return accumulatedBalance;
        }

        // If only 1 day or less passed, use the closing balance as opening balance
        return closingBalance;
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<CashDrawerRecord[]> {
        const result = await this.pool.query(sqlCashDrawerDetail, [startDate, endDate]);

        console.log('dates', startDate, endDate);

        return result.rows.map((row) => new CashDrawerRecord({
            occurredAt: row.occurred_at,
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
