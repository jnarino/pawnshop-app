import { GenerateCashDrawerDetailUseCase } from '../../../../../../../src/application/use-case/reports/cashDrawer/query/GenerateCashDrawerDetailUseCase';
import { CashDrawerReportRepository } from '../../../../../../../src/domains/reports/cashDrawer/CashDrawerReportRepository';
import { CashDrawerRecord, CashDrawerRecordProps } from '../../../../../../../src/domains/reports/cashDrawer/CashDrawerRecord';

const createTestRecord = (overrides: Partial<CashDrawerRecordProps>): CashDrawerRecord => {
    const defaults: CashDrawerRecordProps = {
        occurredAt: new Date(),
        ticketNumber: null,
        employee: 'TEST',
        transactionType: 'TEST',
        transactionCode: 'T',
        amount: 0,
        tenderAmount: 0,
        tenderChange: 0,
        remarks: null,
        paymentMethod: null,
        balance: 0,
    };
    return new CashDrawerRecord({ ...defaults, ...overrides });
};

describe('GenerateCashDrawerDetailUseCase Bugfix - Voided Sales', () => {
    let useCase: GenerateCashDrawerDetailUseCase;
    let mockRepo: jest.Mocked<CashDrawerReportRepository>;

    beforeEach(() => {
        mockRepo = {
            getLastClose: jest.fn(),
            findByDateRange: jest.fn(),
        } as any;

        useCase = new GenerateCashDrawerDetailUseCase(mockRepo);
    });

    it('should correctly subtract VOIDED SALE from sales total', async () => {
        // Setup mock data based on user issues
        
        // Just setting up a previous close so opening balance isn't 0, though it doesn't strictly matter for the Sales Summary totals
        mockRepo.getLastClose.mockResolvedValue({
            amount: 10841.38,
            occurredAt: new Date('2026-01-13T18:00:00.000Z'),
        });

        // We'll create a subset of records that reproduces the issue
        // 1. Some regular sales
        // 2. The voided sale
        // 3. Check totals

        const records: CashDrawerRecord[] = [
            // ... specific records from user provided data ...
            
            // "Retail Sale" 20.00
            createTestRecord({
                occurredAt: new Date("2026-01-14T10:18:36.000Z"),
                ticketNumber: "111385",
                employee: "CPK",
                transactionType: "RETAIL SALE",
                amount: 20,
                paymentMethod: "CASH"
            }),
             // "Retail Sale" 149.00
             createTestRecord({
                occurredAt: new Date("2026-01-14T10:45:34.000Z"),
                ticketNumber: "111386",
                employee: "CPK",
                transactionType: "RETAIL SALE",
                amount: 149,
                paymentMethod: "CASH"
            }),
             // "Retail Sale" 65.00
             createTestRecord({
                occurredAt: new Date("2026-01-14T11:07:09.000Z"),
                ticketNumber: "111387",
                employee: "JL",
                transactionType: "RETAIL SALE",
                amount: 65,
                paymentMethod: "CASH"
            }),
             // "Retail Sale" 319.00
             createTestRecord({
                occurredAt: new Date("2026-01-14T12:29:57.000Z"),
                ticketNumber: "111388",
                employee: "CAZ",
                transactionType: "RETAIL SALE",
                amount: 319,
                paymentMethod: "CASH"
            }),
             // "Retail Sale" 392.99
             createTestRecord({
                occurredAt: new Date("2026-01-14T14:43:50.000Z"),
                ticketNumber: "111389",
                employee: "CAZ",
                transactionType: "RETAIL SALE",
                amount: 392.99,
                paymentMethod: "CASH"
            }),
            // "Retail Sale" 155.00
            createTestRecord({
                occurredAt: new Date("2026-01-14T14:46:58.000Z"),
                ticketNumber: "111390",
                employee: "CPK",
                transactionType: "RETAIL SALE",
                amount: 155,
                paymentMethod: "DEBIT"
            }), 
            
            // Layaway Deposit 40.00
            createTestRecord({
                occurredAt: new Date("2026-01-14T15:00:12.000Z"),
                ticketNumber: "111391",
                employee: "CPK",
                transactionType: "LAYAWAY DEPOSIT",
                amount: 40,
                paymentMethod: "CASH"
            }),

            // THE VOIDED SALE: -307.79
            createTestRecord({
                occurredAt: new Date("2026-01-14T15:16:58.000Z"),
                ticketNumber: "110914",
                employee: "JN",
                transactionType: "VOIDED SALE",
                amount: -307.79,
                paymentMethod: "CASH"
            }),

            // Another Retail Sale: 510.14
             createTestRecord({
                occurredAt: new Date("2026-01-14T15:20:39.000Z"),
                ticketNumber: "111392",
                employee: "JL",
                transactionType: "RETAIL SALE",
                amount: 510.14,
                paymentMethod: "CASH"
            }),
        ];

        mockRepo.findByDateRange.mockResolvedValue(records);

        // Sum of positive sales: 20 + 149 + 65 + 319 + 392.99 + 155 + 510.14 = 1611.13
        // Sum of layaway: 40
        // Total Sales (current logic): 1611.13 + 40 = 1651.13
        
        // Expected Sales after fix: 1611.13 - 307.79 = 1303.34
        // Expected Total Sales after fix: 1651.13 - 307.79 = 1343.34

        const input = {
            startDate: '2026-01-14T00:00:00.000Z',
            endDate: '2026-01-14T23:59:59.000Z'
        };

        const result = await useCase.execute(input);

        expect(result.salesSummary.totalSales).toBeCloseTo(1343.34, 2);
        expect(result.salesSummary.sales).toBeCloseTo(1303.34, 2);
    });
});
