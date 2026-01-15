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

        // Determine opening balance:
        // 1) Get last close (MB) before start
        // 2) If last close is more than 1 calendar day before start, accumulate transactions
        //    between last close and start-of-day to compute carryover; otherwise use last close amount.
        let openingBalance = 0;
        const lastClose = await this.repo.getLastClose(start);
        if (lastClose) {
            const closingAmount = lastClose.amount;
            const lastCloseDate = lastClose.occurredAt;

            const lastCloseDay = this.startOfDayUTC(lastCloseDate);
            const reportDay = this.startOfDayUTC(start);
            const daysDifference = Math.floor((reportDay.getTime() - lastCloseDay.getTime()) / (1000 * 60 * 60 * 24));

            // If the last close happened on any prior calendar day, accumulate.
            if (daysDifference > 1) {
                console.log('Accumulating from last close:', lastCloseDate, 'to report day:', reportDay);
                // Process transactions from last close timestamp up to start of report day
                // Add one minute to lastCloseDate to exclude the close transaction itself
                const accumulationStartDate = new Date(lastCloseDate.getTime() + 60000);
                // Set accumulation end to the last moment before the report day (end of previous day)
                const accumulationEndDate = new Date(start.getTime() - 1);
                console.log('Accumulation window - Start (after close):', accumulationStartDate, 'End (before report):', accumulationEndDate);
                const accumulationRecords = await this.processRecordsWithBalance(accumulationStartDate, accumulationEndDate, closingAmount);
                const transactionDtos = accumulationRecords.map(toCashDrawerDetailDto);
                console.log('Accumulation records count:', accumulationRecords.length);
                if (accumulationRecords.length > 0) {
                    console.log('First accumulation record:', transactionDtos[0]);
                    console.log('Last accumulation record:', transactionDtos[accumulationRecords.length - 1]);
                }
                // Extract the final balance before the report start date
                const carryover = accumulationRecords.length > 0
                    ? accumulationRecords[accumulationRecords.length - 1].balance - closingAmount
                    : 0;
                console.log('Carryover balance:', carryover, '= final balance', accumulationRecords.length > 0 ? accumulationRecords[accumulationRecords.length - 1].balance : 0, '- close amount', closingAmount);
                openingBalance = closingAmount + carryover;
            } else {
                openingBalance = closingAmount;
            }
        }

        const withRecalculatedBalance = await this.processRecordsWithBalance(start, end, openingBalance);

        if (!withRecalculatedBalance.length) {
            throw new NotFoundError('No cash drawer records for the selected date range');
        }

        // Map to DTOs
        const transactionDtos = withRecalculatedBalance.map(toCashDrawerDetailDto);

        // Calculate all summaries
        const startingBalance = openingBalance;
        const endingBalance = startingBalance + this.calculateSalesSummary(withRecalculatedBalance).totalSales
            + this.calculatePawnsBuys(withRecalculatedBalance).totalPawnsBuys
            + this.calculateCashAdded(withRecalculatedBalance).totalCashAdded
            + this.calculateCashOut(withRecalculatedBalance).totalCashOut;

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

    private async processRecordsWithBalance(
        startDate: Date,
        endDate: Date,
        initialBalance: number
    ): Promise<CashDrawerRecord[]> {
        const records = await this.repo.findByDateRange(startDate, endDate);
        if (!records.length) {
            return [];
        }

        // Group by transaction (ticketNumber + occurredAt + employee) and aggregate payment methods
        const grouped = this.groupByTransaction(records);

        // Calculate running balance starting from initial balance
        const withRecalculatedBalance = this.recalculateRunningBalance(grouped, initialBalance);

        return withRecalculatedBalance;
    }

    private calculateSalesSummary(records: CashDrawerRecord[]) {

        let sales = 0;
        let creditSales = 0;
        let layaways = 0;
        let repairs = 0;

        const seenTx = new Set<string>();

        for (const record of records) {
            const type = record.transactionType.toUpperCase();
            if (this.shouldIgnoreForTotals(type)) continue;

            const txKey = `${record.occurredAt.getTime()}_${record.ticketNumber}_${record.employee}_${record.transactionType}`;
            if (seenTx.has(txKey)) {
                continue; // only count once per transaction (ignore multi-tender duplicates)
            }
            seenTx.add(txKey);

            const amt = record.amount;

            if (type === 'RETAIL SALE' || type === 'SALE' || type === 'VOIDED SALE') {
                sales += amt;
            } else if (type.includes('LAYAWAY')) {
                layaways += amt;
            } else if (type.includes('REPAIR')) {
                repairs += amt;
            } else if (type.includes('DEPOSIT') && type.includes('BANK')) {
                creditSales += amt;
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

            if (type.includes('CASH ADDED') || type.includes('BALANCE') || type.includes('WITHDRAWAL FROM BANK')) {
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
                // Split redemption into principal (pawnRedeems) and interest/fees (pawnPayments) when available
                const principal = record.principalComponent ?? record.amount;
                const interest = record.interestComponent ?? 0;

                pawnRedeems += principal;
                pawnPayments += interest;
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
                        transactionCode: existing.transactionCode,
                        amount: existing.amount,
                        tenderAmount: existing.tenderAmount,
                        tenderChange: existing.tenderChange,
                        remarks: existing.remarks,
                        paymentMethod: paymentMethods,
                        balance: existing.balance, // Temporary; will be recalculated
                        principalComponent: (existing.principalComponent ?? existing.amount) + (record.principalComponent ?? record.amount),
                        interestComponent: (existing.interestComponent ?? 0) + (record.interestComponent ?? 0),
                    })
                );
            }
        }

        // Return grouped records in original order
        return Array.from(groupMap.values());
    }

    private recalculateRunningBalance(records: CashDrawerRecord[], openingBalance: number = 0): CashDrawerRecord[] {
        if (records.length === 0) {
            return records;
        }

        let runningBalance = openingBalance;

        // Ensure we only apply the transaction amount once per unique transaction
        // while still emitting one line per tender for visibility. Use a transaction
        // key that ignores `paymentMethod` to detect multiple tender lines for
        // the same transaction.
        const seenTransactions = new Set<string>();

        return records.map((record) => {
            const txKey = `${record.occurredAt.getTime()}_${record.ticketNumber}_${record.employee}_${record.transactionType}`;

            if (!seenTransactions.has(txKey)) {
                // Gather all lines for this transaction (ignore paymentMethod in key)
                const group = records.filter(
                    (r) => `${r.occurredAt.getTime()}_${r.ticketNumber}_${r.employee}_${r.transactionType}` === txKey
                );

                // Determine if multi-tender (different payment methods)
                const methods = new Set(
                    group.map((g) => (g.paymentMethod ? g.paymentMethod.toUpperCase() : ''))
                );

                let effectiveAmount: number;
                if (methods.size > 1) {
                    const typeUpper = record.transactionType.toUpperCase();
                    if (typeUpper.startsWith('DEPOSIT FROM MAIN')) {
                        // For DEPOSIT FROM MAIN, apply the full transaction impact (sum all tenders)
                        effectiveAmount = group.reduce((s, g) => s + (g.amount ?? 0), 0);
                    } else {
                        // For typical multi-tender sales/payments, entries duplicate the full amount per tender.
                        // Apply the transaction effect once using the first occurrence amount.
                        effectiveAmount = group[0].amount;
                    }
                } else {
                    // Single tender (or duplicates of same method): sum amounts
                    effectiveAmount = group.reduce((s, g) => s + (g.amount ?? 0), 0);
                }

                runningBalance += effectiveAmount;
                seenTransactions.add(txKey);
            }

            return new CashDrawerRecord({
                occurredAt: record.occurredAt,
                ticketNumber: record.ticketNumber,
                employee: record.employee,
                transactionType: record.transactionType,
                transactionCode: record.transactionCode,
                amount: record.amount,
                tenderAmount: record.tenderAmount,
                tenderChange: record.tenderChange,
                remarks: record.remarks,
                paymentMethod: record.paymentMethod,
                balance: runningBalance,
                principalComponent: record.principalComponent,
                interestComponent: record.interestComponent,
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
