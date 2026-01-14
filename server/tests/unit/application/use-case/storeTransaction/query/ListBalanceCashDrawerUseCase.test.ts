import { ListBalanceCashDrawerUseCase } from '../../../../../../src/application/use-case/storeTransaction/query/ListBalanceCashDrawerUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';

describe('ListBalanceCashDrawerUseCase', () => {
  let storeTransactionRepo: jest.Mocked<StoreTransactionRepository>;
  let useCase: ListBalanceCashDrawerUseCase;

  beforeEach(() => {
    storeTransactionRepo = {
      getLastClose: jest.fn(),
      getActivitySinceClose: jest.fn()
    } as any;

    useCase = new ListBalanceCashDrawerUseCase(storeTransactionRepo);
  });

  it('calculates current balance as lastCloseBalance + sum of activity', async () => {
    // Last close: $1000 at Dec 31
    // Activity since:
    //   - CASH: +$500
    //   - DEBIT: -$100
    //   - VISA: +$200
    // Current CASH balance: 1000 + 500 = $1500

    storeTransactionRepo.getLastClose.mockResolvedValue({
      id: 'close-1',
      occurredAt: new Date('2025-12-31T18:00:54Z'),
      amount: 1000
    });

    storeTransactionRepo.getActivitySinceClose.mockResolvedValue([
      { id: 'tx-1', occurredAt: new Date('2026-01-01T09:00:00Z'), tenderTypeId: 1, tenderTypeName: 'CASH', amount: 500 },
      { id: 'tx-2', occurredAt: new Date('2026-01-01T10:00:00Z'), tenderTypeId: 3, tenderTypeName: 'DEBIT', amount: -100 },
      { id: 'tx-3', occurredAt: new Date('2026-01-01T11:00:00Z'), tenderTypeId: 6, tenderTypeName: 'VISA', amount: 200 }
    ]);

    const result = await useCase.execute({});

    expect(result.lastCloseBalance).toBe(1000);
    expect(result.currentBalance).toBe(1500);  // 1000 + 500 (CASH activity)
    
    // mainDrawerBalance should have all 8 tender types
    expect(result.mainDrawerBalance.CASH).toBe(1500);
    expect(result.mainDrawerBalance.DEBIT).toBe(-100);
    expect(result.mainDrawerBalance.VISA).toBe(200);
    expect(result.mainDrawerBalance['AMERICAN EXPRESS']).toBe(0);
    expect(result.mainDrawerBalance.DISCOVER).toBe(0);
    expect(result.mainDrawerBalance['MASTER CARD']).toBe(0);
    expect(result.mainDrawerBalance.CHECK).toBe(0);
    expect(result.mainDrawerBalance['CASH PASS']).toBe(0);
  });

  it('handles no close history (null last close)', async () => {
    storeTransactionRepo.getLastClose.mockResolvedValue(null);
    storeTransactionRepo.getActivitySinceClose.mockResolvedValue([
      { id: 'tx-1', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: 100 }
    ]);

    const result = await useCase.execute({});

    expect(result.lastCloseOccurredAt).toBeNull();
    expect(result.lastCloseBalance).toBe(0);
    expect(result.currentBalance).toBe(100);  // 0 + 100
    expect(result.mainDrawerBalance.CASH).toBe(100);
    // All other tenders should be 0
    expect(result.mainDrawerBalance.DEBIT).toBe(0);
    expect(result.mainDrawerBalance.VISA).toBe(0);
  });

  it('returns asOf timestamp', async () => {
    storeTransactionRepo.getLastClose.mockResolvedValue(null);
    storeTransactionRepo.getActivitySinceClose.mockResolvedValue([]);

    const before = Date.now();
    const result = await useCase.execute({});
    const after = Date.now();

    const asOfTime = new Date(result.asOf).getTime();
    expect(asOfTime).toBeGreaterThanOrEqual(before - 1000);
    expect(asOfTime).toBeLessThanOrEqual(after + 1000);
  });

  it('throws when there is a prior close and no activity after it', async () => {
    storeTransactionRepo.getLastClose.mockResolvedValue({
      id: 'close-1',
      occurredAt: new Date('2025-12-31T18:00:54Z'),
      amount: 500
    });
    storeTransactionRepo.getActivitySinceClose.mockResolvedValue([]);

    await expect(useCase.execute({})).rejects.toThrow('There are no more transactions after the last close.');
  });

  it('aggregates multiple transactions for same tender', async () => {
    storeTransactionRepo.getLastClose.mockResolvedValue({
      id: 'close-1',
      occurredAt: new Date('2025-12-31T18:00:54Z'),
      amount: 1000
    });

    storeTransactionRepo.getActivitySinceClose.mockResolvedValue([
      { id: 'tx-1', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: 200 },
      { id: 'tx-2', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: 150 },
      { id: 'tx-3', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: -50 }
    ]);

    const result = await useCase.execute({});

    // All CASH transactions should sum to 300
    expect(result.mainDrawerBalance.CASH).toBe(1300);  // 1000 + 300
    expect(result.currentBalance).toBe(1300);
  });

  it('includes all 8 tender types even with zero values', async () => {
    storeTransactionRepo.getLastClose.mockResolvedValue({
      id: 'close-1',
      occurredAt: new Date('2025-12-31T18:00:54Z'),
      amount: 1000
    });

    storeTransactionRepo.getActivitySinceClose.mockResolvedValue([
      { id: 'tx-1', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: 100 }
    ]);

    const result = await useCase.execute({});

    // All 8 tender types should be present
    expect(result.mainDrawerBalance.CASH).toBe(1100);
    expect(result.mainDrawerBalance['AMERICAN EXPRESS']).toBe(0);
    expect(result.mainDrawerBalance.DEBIT).toBe(0);
    expect(result.mainDrawerBalance.DISCOVER).toBe(0);
    expect(result.mainDrawerBalance['MASTER CARD']).toBe(0);
    expect(result.mainDrawerBalance.VISA).toBe(0);
    expect(result.mainDrawerBalance.CHECK).toBe(0);
    expect(result.mainDrawerBalance['CASH PASS']).toBe(0);
  });
});

