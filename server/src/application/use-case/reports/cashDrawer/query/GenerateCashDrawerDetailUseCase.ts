import { string, date } from "zod";
import { CashDrawerRecord } from "../../../../../domains/reports/cashDrawer/CashDrawerRecord";
import { CashDrawerReportRepository } from "../../../../../domains/reports/cashDrawer/CashDrawerReportRepository";
import { NotFoundError } from "../../../../common/errors";
import { CashDrawerDetailResponseDto } from "../../../../dto/reports/cashDrawer/query/CashDrawerDetailResponseDto";
import { GetCashDrawerDetailRequestDto, getCashDrawerDetailRequestSchema } from "../../../../dto/reports/cashDrawer/query/GetCashDrawerDetailRequestDto";
import { toCashDrawerDetailDto } from "../../../../mapping/reports/cashDrawer/cashDrawerMapper";

export class GenerateCashDrawerDetailUseCase {
    constructor(private readonly repo: CashDrawerReportRepository) { }

    async execute(input: unknown): Promise<CashDrawerDetailResponseDto[]> {
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

        return withRecalculatedBalance.map(toCashDrawerDetailDto);
    }

    private groupByTransaction(records: CashDrawerRecord[]): CashDrawerRecord[] {
        const groupMap = new Map<string, CashDrawerRecord>();

        for (const record of records) {
            // Create a key that uniquely identifies a transaction
            // Include transactionType to avoid grouping different transactions with same timestamp/ticket/employee
            const key = `${record.occurredAt.getTime()}_${record.ticketNumber}_${record.employee}_${record.transactionType}`;

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
            const start = startDate ? new Date(startDate) : this.startOfDay(new Date());
            const end = endDate ? new Date(endDate) : this.endOfDay(new Date(start));
            return { start: this.startOfDay(start), end: this.endOfDay(end) };
        }

        const today = new Date();
        return { start: this.startOfDay(today), end: this.endOfDay(today) };
    }

    private startOfDay(date: Date): Date {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    private endOfDay(date: Date): Date {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    }
}
