import { GetSalesTaxesUseCase } from '../../../../../../../src/application/use-case/reports/taxes/query/GetSalesTaxesUseCase';
import { SalesTaxTotalsService } from '../../../../../../../src/application/service/reports/taxes/SalesTaxTotalsService';
import { SalesTaxReportRepository } from '../../../../../../../src/domains/reports/taxes/SalesTaxReportRepository';
import { SalesTaxRecord, SalesTaxRecordProps } from '../../../../../../../src/domains/reports/taxes/SalesTaxRecord';

const createTestRecord = (overrides: Partial<SalesTaxRecordProps>): SalesTaxRecord => {
  const defaults: SalesTaxRecordProps = {
    occurredAt: new Date('2026-01-31T12:00:00.000Z'),
    type: 'RETAIL SALE',
    ticketNumber: '111524',
    grossAmount: 60,
    taxableAmount: 60,
    taxCollected: 3.9,
  };

  return new SalesTaxRecord({ ...defaults, ...overrides });
};

describe('GetSalesTaxesUseCase', () => {
  let useCase: GetSalesTaxesUseCase;
  let mockRepo: jest.Mocked<SalesTaxReportRepository>;

  beforeEach(() => {
    mockRepo = {
      findByDateRange: jest.fn(),
    } as any;

    useCase = new GetSalesTaxesUseCase(mockRepo, new SalesTaxTotalsService(0.065));
  });

  it('should return rows and totals for the date range', async () => {
    mockRepo.findByDateRange.mockResolvedValue([
      createTestRecord({
        occurredAt: new Date('2026-01-31T11:46:32.000Z'),
        ticketNumber: '111524',
        grossAmount: 60,
        taxableAmount: 60,
        taxCollected: 3.9,
      }),
      createTestRecord({
        occurredAt: new Date('2026-01-31T11:51:02.000Z'),
        ticketNumber: '111525',
        grossAmount: 530.52,
        taxableAmount: 530.52,
        taxCollected: 34.48,
      }),
    ]);

    const result = await useCase.execute({
      startDate: '2026-01-31T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.000Z',
      onlyTotals: false,
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].date).toBe('01/31/2026');
    expect(result.totals.grossSales).toBeCloseTo(590.52, 2);
    expect(result.totals.taxableSales).toBeCloseTo(590.52, 2);
    expect(result.totals.exemptSales).toBeCloseTo(0, 2);
    expect(result.totals.stateTaxCalculated).toBeCloseTo(38.38, 2);
    expect(result.totals.collectionAllowances.stateTax).toBeCloseTo(0.96, 2);
    expect(result.totals.amountDueWithReturn).toBeCloseTo(37.42, 2);
  });

  it('should return totals only when onlyTotals is true', async () => {
    mockRepo.findByDateRange.mockResolvedValue([
      createTestRecord({
        grossAmount: 100,
        taxableAmount: 80,
        taxCollected: 5.2,
      }),
    ]);

    const result = await useCase.execute({
      startDate: '2026-01-31T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.000Z',
      onlyTotals: true,
    });

    expect(result.rows).toHaveLength(0);
    expect(result.totals.grossSales).toBeCloseTo(100, 2);
    expect(result.totals.taxableSales).toBeCloseTo(80, 2);
    expect(result.totals.exemptSales).toBeCloseTo(20, 2);
    expect(result.totals.stateTaxCalculated).toBeCloseTo(5.2, 2);
    expect(result.totals.collectionAllowances.stateTax).toBeCloseTo(0.13, 2);
    expect(result.totals.amountDueWithReturn).toBeCloseTo(5.07, 2);
  });

  it('should treat "false" string as false', async () => {
    mockRepo.findByDateRange.mockResolvedValue([
      createTestRecord({
        grossAmount: 100,
        taxableAmount: 80,
        taxCollected: 5.2,
      }),
    ]);

    const result = await useCase.execute({
      startDate: '2026-01-31T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.000Z',
      onlyTotals: 'false',
    });

    expect(result.rows).toHaveLength(1);
  });

  it('should throw on invalid date input', async () => {
    await expect(useCase.execute({
      startDate: 'not-a-date',
    })).rejects.toThrow();
  });
});
