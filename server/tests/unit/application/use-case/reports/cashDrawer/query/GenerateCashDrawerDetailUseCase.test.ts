import { GenerateCashDrawerDetailUseCase } from '../../../../../../../src/application/use-case/reports/cashDrawer/query/GenerateCashDrawerDetailUseCase';
import { CashDrawerReportRepository } from '../../../../../../../src/domains/reports/cashDrawer/CashDrawerReportRepository';
import { CashDrawerRecord } from '../../../../../../../src/domains/reports/cashDrawer/CashDrawerRecord';

describe('GenerateCashDrawerDetailUseCase', () => {
  let repo: jest.Mocked<CashDrawerReportRepository>;
  let useCase: GenerateCashDrawerDetailUseCase;

  beforeEach(() => {
    repo = {
      findByDateRange: jest.fn(),
    } as any;
    useCase = new GenerateCashDrawerDetailUseCase(repo);
  });

  const makeRecord = (
    occurredAt: string,
    ticketNumber: string | null,
    employee: string,
    transactionType: string,
    amount: number,
    tenderChange: number,
    remarks: string | null,
    paymentMethod: string | null,
    balance: number,
    principalComponent?: number,
    interestComponent?: number,
  ) =>
    new CashDrawerRecord({
      occurredAt: new Date(occurredAt),
      ticketNumber,
      employee,
      transactionType,
      amount,
      tenderChange,
      remarks,
      paymentMethod,
      balance,
      principalComponent,
      interestComponent,
    });

  it('computes cash drawer summaries for the provided snapshot', async () => {
    const records: CashDrawerRecord[] = [
      makeRecord('2025-12-12T09:44:32Z', '110936', 'CPK', 'RETAIL SALE', 76.88, 0, null, 'CHECK', 9519.53, 0, 0),
      makeRecord('2025-12-12T09:53:07Z', '110937', 'JL', 'RETAIL SALE', 400, 0, null, 'DEBIT', 9919.53, 0, 0),
      makeRecord('2025-12-12T09:54:57Z', '117787', 'CPK', 'PAWN (loan cash out)', -150, 0, null, 'CASH', 9769.53, 0, 0),
      makeRecord('2025-12-12T10:07:01Z', '117632', 'JL', 'REDEMPTION PAYMENT', 50, 0, null, 'CASH', 9819.53, 40, 10),
      makeRecord('2025-12-12T10:23:01Z', '117468', 'JL', 'PAWN PAYMENT (interest/principal)', 10, 0, null, 'CASH', 9829.53, 0, 0),
      makeRecord('2025-12-12T10:23:01Z', '117016', 'JL', 'PAWN PAYMENT (interest/principal)', 12.5, 0.25, null, 'CASH', 9842.03, 0, 0),
      makeRecord('2025-12-12T10:23:01Z', '117384', 'JL', 'PAWN PAYMENT (interest/principal)', 6.25, 0, null, 'CASH', 9848.28, 0, 0),
      makeRecord('2025-12-12T11:01:49Z', '110938', 'JL', 'RETAIL SALE', 4000, 0, null, 'DEBIT', 13848.28, 0, 0),
      makeRecord('2025-12-12T11:05:02Z', '110939', 'JL', 'RETAIL SALE', 20, 0, null, 'CASH', 13868.28, 0, 0),
      makeRecord('2025-12-12T11:23:10Z', '528556', 'JL', 'BUY (cash out to seller)', -900, 0, null, 'CASH', 12968.28, 0, 0),
      makeRecord('2025-12-12T11:33:43Z', '117788', 'JN', 'PAWN (loan cash out)', -240, 0, null, 'CASH', 12728.28, 0, 0),
      makeRecord('2025-12-12T11:35:39Z', null, 'CPK', 'CASH OUT - MAIN (from drawer to main)', -60, 0, 'CHEFS CORNER', 'CASH', 12668.28, 0, 0),
      makeRecord('2025-12-12T11:42:05Z', '117789', 'JL', 'PAWN (loan cash out)', -350, 0, null, 'CASH', 12318.28, 0, 0),
      makeRecord('2025-12-12T11:42:43Z', '110940', 'JL', 'RETAIL SALE', 372.75, 0, null, 'DEBIT', 12691.03, 0, 0),
      makeRecord('2025-12-12T11:58:41Z', '117442', 'JL', 'REDEMPTION PAYMENT', 875, 5, null, 'CASH', 13566.03, 700, 175),
      makeRecord('2025-12-12T12:02:56Z', '528557', 'CPK', 'BUY (cash out to seller)', -1930, 0, null, 'CASH', 11636.03, 0, 0),
      makeRecord('2025-12-12T12:06:15Z', '110941', 'CPK', 'RETAIL SALE', 0.03, 0, null, 'CASH', 11636.06, 0, 0),
      makeRecord('2025-12-12T13:22:56Z', '117416', 'CPK', 'REDEMPTION PAYMENT', 150, 0, null, 'DEBIT', 11786.06, 100, 50),
      makeRecord('2025-12-12T13:42:31Z', '528558', 'JN', 'BUY (cash out to seller)', -2470, 0, null, 'CASH', 9316.06, 0, 0),
      makeRecord('2025-12-12T13:55:02Z', '117790', 'JL', 'PAWN (loan cash out)', -40, 0, null, 'CASH', 9276.06, 0, 0),
      makeRecord('2025-12-12T14:55:40Z', '117791', 'JN', 'PAWN (loan cash out)', -140, 0, null, 'CASH', 9136.06, 0, 0),
      makeRecord('2025-12-12T15:03:31Z', '110942', 'DS', 'RETAIL SALE', 239.63, 0, null, 'MASTER CARD', 9375.69, 0, 0),
      makeRecord('2025-12-12T15:05:11Z', '110943', 'CPK', 'RETAIL SALE', 289, 0, null, 'DEBIT', 9664.69, 0, 0),
      makeRecord('2025-12-12T15:05:43Z', '117792', 'JN', 'PAWN (loan cash out)', -70, 0, null, 'CASH', 9594.69, 0, 0),
      makeRecord('2025-12-12T15:18:14Z', '117612', 'CPK', 'PAWN PAYMENT (interest/principal)', 15, 0, null, 'DEBIT', 9609.69, 0, 0),
      makeRecord('2025-12-12T16:39:18Z', null, 'CPK', 'CASH OUT - MAIN (from drawer to main)', -2.44, 0, 'SAVE A LOT', 'CASH', 9607.25, 0, 0),
      makeRecord('2025-12-12T16:40:59Z', '110944', 'DS', 'RETAIL SALE', 1810.5, 0, null, 'VISA', 11417.75, 0, 0),
      makeRecord('2025-12-12T16:40:59Z', '110944', 'DS', 'RETAIL SALE', 1810.5, 0, null, 'VISA', 13228.25, 0, 0),
      makeRecord('2025-12-12T16:55:42Z', '110945', 'CPK', 'CASH ADDED - MAIN (safe/bank op)', 5, 0, 'GUN PROCESSING FEE-S', 'CASH', 13233.25, 0, 0),
      makeRecord('2025-12-12T16:55:42Z', '110945', 'CPK', 'RETAIL SALE', 394, 0, null, 'CASH', 13627.25, 0, 0),
      makeRecord('2025-12-12T17:16:33Z', '117612', 'JL', 'REDEMPTION PAYMENT', 60, 0, null, 'DEBIT', 13687.25, 60, 0),
      makeRecord('2025-12-12T17:16:33Z', '117612', 'JL', 'CASH ADDED - MAIN (safe/bank op)', 5, 0, 'GUN PROCESSING FEE-P', 'DEBIT', 13692.25, 0, 0),
      makeRecord('2025-12-12T17:34:43Z', '110946', 'JN', 'RETAIL SALE', 138.45, 0, null, 'VISA', 13830.7, 0, 0),
      makeRecord('2025-12-12T18:17:25Z', null, 'CDC', 'MAIN BALANCE (admin)', 4462.99, 0, null, 'CASH', 18293.69, 0, 0),
      makeRecord('2025-12-12T18:17:25Z', null, 'CDC', 'DEPOSIT FROM MAIN (to drawer)', -1948.95, 0, null, 'VISA', 16344.74, 0, 0),
      makeRecord('2025-12-12T18:17:25Z', null, 'CDC', 'DEPOSIT FROM MAIN (to drawer)', -5291.75, 0, null, 'DEBIT', 11052.99, 0, 0),
      makeRecord('2025-12-12T18:17:25Z', null, 'CDC', 'DEPOSIT FROM MAIN (to drawer)', -4462.99, 0, null, 'CASH', 6590, 0, 0),
      makeRecord('2025-12-12T18:17:25Z', null, 'CDC', 'DEPOSIT FROM MAIN (to drawer)', -239.63, 0, null, 'MASTER CARD', 6350.37, 0, 0),
      makeRecord('2025-12-12T18:17:25Z', null, 'CDC', 'DEPOSIT FROM MAIN (to drawer)', -76.88, 0, null, 'CHECK', 6273.49, 0, 0),
    ];

    repo.findByDateRange.mockResolvedValue(records);

    const result = await useCase.execute({
      startDate: '2025-12-12T00:00:00.000Z',
      endDate: '2025-12-12T23:59:59.999Z',
    });

    expect(result.cashOut.depositToBank).toBeCloseTo(-7557.21, 2);
    expect(result.cashOut.cashRemoved).toBeCloseTo(-62.44, 2);
    expect(result.pawnsBuys.totalPawnsBuys).toBeCloseTo(-5111.25, 2);
    expect(result.pawnsBuys.pawnRedeems).toBeCloseTo(900, 2);
    expect(result.pawnsBuys.pawnPayments).toBeCloseTo(278.75, 2);
    expect(result.pawnsBuys.pawns).toBeCloseTo(-990, 2);
    expect(result.pawnsBuys.buys).toBeCloseTo(-5300, 2);
    expect(result.salesSummary.totalSales).toBeCloseTo(7741.24, 2);
    expect(result.cashAdded.totalCashAdded).toBeCloseTo(10, 2);
    expect(result.summary.endingBalance).toBeCloseTo(4462.99, 2);
  });

  it('properly categorizes WITHDRAWAL FROM BANK as cashAddedFromBank', async () => {
    const records: CashDrawerRecord[] = [
      makeRecord('2026-01-05T09:00:00Z', '117943', 'CDC', 'PAWN (loan cash out)', -100, 0, null, 'CASH', 1073.99, 0, 0),
      makeRecord('2026-01-05T11:24:28Z', null, 'CDC', 'WITHDRAWAL FROM BANK (to drawer)', 15000, 0, 'CASH FROM BANK', 'CASH', 16073.99, 0, 0),
      makeRecord('2026-01-05T11:35:23Z', '117951', 'CAZ', 'PAWN (loan cash out)', -60, 0, null, 'CASH', 16013.99, 0, 0),
    ];

    repo.findByDateRange.mockResolvedValue(records);

    const result = await useCase.execute({
      startDate: '2026-01-05T00:00:00.000Z',
      endDate: '2026-01-05T23:59:59.999Z',
    });

    expect(result.cashAdded.cashAddedFromBank).toBe(15000);
    expect(result.cashAdded.totalCashAdded).toBe(15000);
    expect(result.cashAdded.cashAdded).toBe(0);
    expect(result.cashAdded.fromEmployeeDrawers).toBe(0);
    expect(result.cashAdded.fromMainDrawer).toBe(0);
  });
});
