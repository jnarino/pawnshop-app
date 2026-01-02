import { CashDrawerRecord } from "../../../../../domains/reports/cashDrawer/CashDrawerRecord";
import { CashDrawerReportRepository } from "../../../../../domains/reports/cashDrawer/CashDrawerReportRepository";
import { NotFoundError } from "../../../../common/errors";
import { CashDrawerDetailWithSummaryResponseDto } from "../../../../dto/reports/cashDrawer/query/CashDrawerDetailWithSummaryResponseDto";
import { GetCashDrawerDetailRequestDto, getCashDrawerDetailRequestSchema } from "../../../../dto/reports/cashDrawer/query/GetCashDrawerDetailRequestDto";
import { toCashDrawerDetailDto } from "../../../../mapping/reports/cashDrawer/cashDrawerMapper";

export class GenerateCashDrawerDetailUseCase {
    constructor(private readonly repo: CashDrawerReportRepository) { }

    async execute(input: unknown): Promise<CashDrawerDetailWithSummaryResponseDto> {
        const dto: GetCashDrawerDetailRequestDto = getCashDrawerDetailRequestSchema.parse(input);

        const { start, end } = this.resolveDateRange(dto.startDate, dto.endDate);

        const records = await this.repo.findByDateRange(start, end);
        if (!records.length) {
            throw new NotFoundError('No cash drawer records for the selected date range');
        }

        // Group by transaction (ticketNumber + occurredAt + employee) and aggregate payment methods
        const grouped = this.groupByTransaction(records);

        // Recalculate running balance based on grouped transactions
        const withRecalculatedBalance = this.recalculateRunningBalance(grouped);

        // Map to DTOs
        const transactionDtos = withRecalculatedBalance.map(toCashDrawerDetailDto);

        // Calculate all summaries
        const startingBalance = withRecalculatedBalance.length > 0
            ? withRecalculatedBalance[0].balance - withRecalculatedBalance[0].amount
            : 0;
        const endingBalance = withRecalculatedBalance.length > 0
            ? withRecalculatedBalance[withRecalculatedBalance.length - 1].balance
            : 0;

        return {
            transactions: transactionDtos,
            salesSummary: this.calculateSalesSummary(withRecalculatedBalance),
            cashAdded: this.calculateCashAdded(withRecalculatedBalance),
            pawnsBuys: this.calculatePawnsBuys(withRecalculatedBalance),
            cashOut: this.calculateCashOut(withRecalculatedBalance),
            summary: {
                startingBalance,
                totalSales: this.calculateSalesSummary(withRecalculatedBalance).totalSales,
                totalPawnsBuys: this.calculatePawnsBuys(withRecalculatedBalance).totalPawnsBuys,
                totalCashAdded: this.calculateCashAdded(withRecalculatedBalance).totalCashAdded,
                totalCashOut: this.calculateCashOut(withRecalculatedBalance).totalCashOut,
                customerCredits: 0, // TODO: Calculate from actual data if available
                cashOverShort: 0, // TODO: Calculate from actual data if available
                endingBalance,
            }
        };
    }

    private calculateSalesSummary(records: CashDrawerRecord[]) {

        let sales = 0;
        let creditSales = 0;
        let layaways = 0;
        let repairs = 0;
        let depositToBank = 0;
        let cashRemoved = 0;
        let toEmployeeDrawers = 0;
        let toMainDrawer = 0;
        let amt = 0;
        let pm = '';

        for (const record of records) {
            const type = record.transactionType.toUpperCase();
            if (this.shouldIgnoreForTotals(type)) continue;

            pm = (record.paymentMethod || '').toUpperCase();
            amt = record.amount;

            if (type === 'RETAIL SALE' || type === 'SALE') {
                sales += amt;
            } else if (type.includes('LAYAWAY')) {
                layaways += amt;
            } else if (type.includes('REPAIR')) {
                repairs += amt;
            } else if (type.includes('DEPOSIT') && type.includes('BANK')) {
                depositToBank += amt;
                creditSales += amt;
            } else if (type.includes('TO EMPLOYEE')) {
                toEmployeeDrawers += amt;
            } else if (type.includes('DEPOSIT') && type.includes('MAIN')) {
                toMainDrawer += amt;
            } else if (amt < 0 && !pm.includes('CASH')) {
                // Any other negative non-cash entry counts toward deposit to bank
                depositToBank += amt;
            }
        }
        const totalSales = sales + creditSales + layaways + repairs;

        return { sales, creditSales, layaways, repairs, totalSales };
    }

    private calculateCashAdded(records: CashDrawerRecord[]) {
        let cashAdded = 0;
        let cashAddedFromBank = 0;
        let fromEmployeeDrawers = 0;
        let fromMainDrawer = 0;

        for (const record of records) {
            const type = record.transactionType.toUpperCase();

            if (this.shouldIgnoreForTotals(type)) continue;

            if (type.includes('CASH ADDED') || type.includes('BALANCE')) {
                if (type.includes('BANK')) {
                    cashAddedFromBank += record.amount;
                } else if (type.includes('EMPLOYEE')) {
                    fromEmployeeDrawers += record.amount;
                } else if (type.includes('MAIN')) {
                    fromMainDrawer += record.amount;
                } else {
                    cashAdded += record.amount;
                }
            }
        }

        const totalCashAdded = cashAdded + cashAddedFromBank + fromEmployeeDrawers + fromMainDrawer;

        return { cashAdded, cashAddedFromBank, fromEmployeeDrawers, fromMainDrawer, totalCashAdded };
    }

    private calculatePawnsBuys(records: CashDrawerRecord[]) {
        let buys = 0;
        let pawns = 0;
        let pawnPayments = 0;
        let pawnRedeems = 0;

        for (const record of records) {
            const type = record.transactionType.toUpperCase();

            if (this.shouldIgnoreForTotals(type)) continue;

            if (type.includes('BUY')) {
                buys += record.amount;
            } else if (type.includes('PAWN (')) {
                pawns += record.amount;
            } else if (type.includes('PAWN PAYMENT')) {
                pawnPayments += record.amount;
            } else if (type.includes('REDEMPTION')) {
                pawnRedeems += record.amount;
            }
        }

        const totalPawnsBuys = buys + pawns + pawnPayments + pawnRedeems;

        return { buys, pawns, pawnPayments, pawnRedeems, totalPawnsBuys };
    }

    private calculateCashOut(records: CashDrawerRecord[]) {
        let cashRemoved = 0;
        let depositToBank = 0;
        let toEmployeeDrawers = 0;
        let toMainDrawer = 0;

        for (const record of records) {
            const type = record.transactionType.toUpperCase();
            const pm = (record.paymentMethod || '').toUpperCase();
            const amt = record.amount;

            // For deposits from main, count non-cash amounts toward depositToBank, ignore cash
            if (type.startsWith('DEPOSIT FROM MAIN')) {
                if (!pm.includes('CASH')) depositToBank += amt;
                continue;
            }

            if (this.shouldIgnoreForTotals(type)) continue;

            // Deposit from main: non-cash -> bank, cash -> ignore (already in balance math)
            const isExplicitCashOut = type.startsWith('CASH OUT') || type.includes('CASH REMOVED');

            if (isExplicitCashOut) {
                if (record.remarks && record.remarks.toUpperCase().includes('BANK')) {
                    depositToBank += amt;
                } else {
                    cashRemoved += amt;
                }
            } else if (type.includes('DEPOSIT') && type.includes('BANK')) {
                depositToBank += amt;
            } else if (amt < 0 && !pm.includes('CASH')) {
                // Any other negative non-cash amount counts toward deposit to bank
                depositToBank += amt;
            } else if (type.includes('TO EMPLOYEE')) {
                toEmployeeDrawers += amt;
            } else if (type.includes('DEPOSIT') && type.includes('MAIN')) {
                toMainDrawer += amt;
            }
        }

        const totalCashOut = cashRemoved + depositToBank + toEmployeeDrawers + toMainDrawer;

        return { cashRemoved, depositToBank, toEmployeeDrawers, toMainDrawer, totalCashOut };
    }

    private shouldIgnoreForTotals(typeUpper: string): boolean {
        return typeUpper.startsWith('DEPOSIT FROM MAIN') || typeUpper.startsWith('MAIN BALANCE');
    }

    private groupByTransaction(records: CashDrawerRecord[]): CashDrawerRecord[] {
        const groupMap = new Map<string, CashDrawerRecord>();

        for (const record of records) {
            // Create a key that uniquely identifies a transaction
            // Include transactionType to avoid grouping different transactions with same timestamp/ticket/employee
            const key = `${record.occurredAt.getTime()}_${record.ticketNumber}_${record.employee}_${record.transactionType}_${record.paymentMethod}`;

            if (!groupMap.has(key)) {
                // First occurrence: keep as-is
                groupMap.set(key, record);
            } else {
                // Subsequent occurrences: aggregate payment methods
                const existing = groupMap.get(key)!;
                const paymentMethods = [existing.paymentMethod, record.paymentMethod]
                    .filter((pm) => pm !== null && pm !== undefined)
                    .join(', ');

                // Create a new record with aggregated payment methods
                groupMap.set(
                    key,
                    new CashDrawerRecord({
                        occurredAt: existing.occurredAt,
                        ticketNumber: existing.ticketNumber,
                        employee: existing.employee,
                        transactionType: existing.transactionType,
                        amount: existing.amount,
                        tenderChange: existing.tenderChange,
                        remarks: existing.remarks,
                        paymentMethod: paymentMethods,
                        balance: existing.balance, // Temporary; will be recalculated
                    })
                );
            }
        }

        // Return grouped records in original order
        return Array.from(groupMap.values());
    }

    private recalculateRunningBalance(records: CashDrawerRecord[]): CashDrawerRecord[] {
        if (records.length === 0) {
            return records;
        }

        // Get the initial balance from the first record
        const initialBalance = records[0].balance - records[0].amount;
        let runningBalance = initialBalance;

        return records.map((record) => {
            runningBalance += record.amount;
            return new CashDrawerRecord({
                occurredAt: record.occurredAt,
                ticketNumber: record.ticketNumber,
                employee: record.employee,
                transactionType: record.transactionType,
                amount: record.amount,
                tenderChange: record.tenderChange,
                remarks: record.remarks,
                paymentMethod: record.paymentMethod,
                balance: runningBalance,
            });
        });
    }

    private resolveDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : this.startOfDayUTC(new Date());
            const end = endDate ? new Date(endDate) : this.endOfDayUTC(new Date(start));
            return { start: this.startOfDayUTC(start), end: this.endOfDayUTC(end) };
        }

        const today = new Date();
        return { start: this.startOfDayUTC(today), end: this.endOfDayUTC(today) };
    }

    private startOfDayUTC(date: Date): Date {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }

    private endOfDayUTC(date: Date): Date {
        const d = new Date(date);
        d.setUTCHours(23, 59, 59, 999);
        return d;
    }
}
