import { CloseBalanceCashDrawerUseCase } from '../../../../../../src/application/use-case/storeTransaction/command/CloseBalanceCashDrawerUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { TenderTypeRepository } from '../../../../../../src/domains/tenderType/TenderTypeRepository';
import { StoreTransaction } from '../../../../../../src/domains/storeTransaction/StoreTransaction';

describe('CloseBalanceCashDrawerUseCase', () => {
  let useCase: CloseBalanceCashDrawerUseCase;
  let mockStoreTransactionRepo: jest.Mocked<StoreTransactionRepository>;
  let mockTenderTypeRepo: jest.Mocked<TenderTypeRepository>;

  beforeEach(() => {
    mockStoreTransactionRepo = {
      create: jest.fn(),
      getLastClose: jest.fn(),
      getActivitySinceClose: jest.fn()
    } as any;

    mockTenderTypeRepo = {} as any;

    useCase = new CloseBalanceCashDrawerUseCase(
      mockStoreTransactionRepo,
      mockTenderTypeRepo
    );
  });

  /**
   * Simplified reconciliation test:
   * Last close: $1000
   * CASH activity: +500 (sales) - 300 (payouts) = +200 net
   * DEBIT activity: +400
   * 
   * Close deposits should be:
   * - CASH: $1200 (what we're taking from drawer, since 1000 + 200 - 1200 = 0)
   * - DEBIT: $400 (what we're taking, since 0 + 400 - 400 = 0)
   * 
   * Final CASH balance: $1200
   */
  it('should reconcile real transaction data and create deposits with final balance', async () => {
    const clerkUserId = 'clerk-123';
    
    mockStoreTransactionRepo.getLastClose.mockResolvedValue({
      id: 'last-close-id',
      occurredAt: new Date('2025-12-12T08:00:00Z'),
      amount: 1000
    } as any);

    mockStoreTransactionRepo.getActivitySinceClose.mockResolvedValue([
      // CASH activity: +500 (sales) - 300 (payouts) = +200 net
      { id: 'tx-1', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: 500 },
      { id: 'tx-2', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: -300 },
      
      // DEBIT activity: +400
      { id: 'tx-3', occurredAt: new Date(), tenderTypeId: 3, tenderTypeName: 'DEBIT', amount: 400 }
    ]);

    mockStoreTransactionRepo.create.mockImplementation((tx: StoreTransaction) => 
      Promise.resolve(new StoreTransaction({
        ...tx,
        id: tx.id,
        tenders: tx.tenders || [],
        items: tx.items || []
      }))
    );

    const input = {
      mainDrawerBalance: {
        'CASH': 1200,           // Last (1000) + Activity (200) = 1200, deposit 1200 → reconciles to 0
        'AMERICAN EXPRESS': 0,
        'DEBIT': 400,           // Activity (400), deposit 400 → reconciles to 0
        'DISCOVER': 0,
        'MASTER CARD': 0,
        'VISA': 0,
        'CHECK': 0,
        'CASH PASS': 0
      },
      note: 'End of day close'
    };

    const result = await useCase.execute(input, clerkUserId);

    // Should create 2 DEPOSIT transactions (CASH + DEBIT) + 1 MAIN BALANCE
    expect(result).toHaveLength(3);
    expect(mockStoreTransactionRepo.create).toHaveBeenCalledTimes(3);

    // Verify DEPOSIT transactions
    const depositCalls = mockStoreTransactionRepo.create.mock.calls.slice(0, 2);
    depositCalls.forEach(([tx]) => {
      expect(tx.typeId).toBe(22); // DEPOSIT FROM MAIN
      expect(tx.amount).toBeLessThan(0); // All negative
    });

    // Verify MAIN BALANCE
    const balanceCall = mockStoreTransactionRepo.create.mock.calls[2][0];
    expect(balanceCall.typeId).toBe(23);
  });

  it('should throw ValidationError when reconciliation fails - cash mismatch', async () => {
    const clerkUserId = 'clerk-123';
    
    mockStoreTransactionRepo.getLastClose.mockResolvedValue({
      id: 'last-close-id',
      occurredAt: new Date(),
      amount: 1000
    } as any);

    mockStoreTransactionRepo.getActivitySinceClose.mockResolvedValue([
      { id: 'tx-1', occurredAt: new Date(), tenderTypeId: 1, tenderTypeName: 'CASH', amount: 500 }
    ]);

    const input = {
      mainDrawerBalance: {
        'CASH': 1000, // Wrong! Should be 500 (1000 + 500 - 1000 should = 0)
        'AMERICAN EXPRESS': 0,
        'DEBIT': 0,
        'DISCOVER': 0,
        'MASTER CARD': 0,
        'VISA': 0,
        'CHECK': 0,
        'CASH PASS': 0
      }
    };

    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow('reconciliation failed');
  });

  it('should throw ValidationError when activity exists but no deposit recorded', async () => {
    const clerkUserId = 'clerk-123';
    
    mockStoreTransactionRepo.getLastClose.mockResolvedValue(null);
    mockStoreTransactionRepo.getActivitySinceClose.mockResolvedValue([
      { id: 'tx-1', occurredAt: new Date(), tenderTypeId: 6, tenderTypeName: 'VISA', amount: 200 }
    ]);

    const input = {
      mainDrawerBalance: {
        'CASH': 0,
        'AMERICAN EXPRESS': 0,
        'DEBIT': 0,
        'DISCOVER': 0,
        'MASTER CARD': 0,
        'VISA': 0, // Activity exists but not depositing anything
        'CHECK': 0,
        'CASH PASS': 0
      }
    };

    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow('activity but no deposit');
  });

  it('should create only MAIN BALANCE when starting fresh with no prior balance', async () => {
    const clerkUserId = 'clerk-123';
    
    mockStoreTransactionRepo.getLastClose.mockResolvedValue(null);
    mockStoreTransactionRepo.getActivitySinceClose.mockResolvedValue([]);

    mockStoreTransactionRepo.create.mockImplementation((tx: StoreTransaction) => 
      Promise.resolve(new StoreTransaction({
        ...tx,
        id: tx.id,
        tenders: tx.tenders || [],
        items: tx.items || []
      }))
    );

    const input = {
      mainDrawerBalance: {
        'CASH': 0,
        'AMERICAN EXPRESS': 0,
        'DEBIT': 0,
        'DISCOVER': 0,
        'MASTER CARD': 0,
        'VISA': 0,
        'CHECK': 0,
        'CASH PASS': 0
      }
    };

    const result = await useCase.execute(input, clerkUserId);

    // Only MAIN BALANCE created (no deposits if all amounts are 0)
    expect(result).toHaveLength(1);
    expect(result[0].typeId).toBe(23);
  });

  it('should use custom occurredAt timestamp for all transactions', async () => {
    const clerkUserId = 'clerk-123';
    const customDate = '2025-12-12T18:00:00.000Z';
    
    mockStoreTransactionRepo.getLastClose.mockResolvedValue(null);
    mockStoreTransactionRepo.getActivitySinceClose.mockResolvedValue([]);

    mockStoreTransactionRepo.create.mockImplementation((tx: StoreTransaction) => 
      Promise.resolve(new StoreTransaction({
        ...tx,
        id: tx.id,
        tenders: tx.tenders || [],
        items: tx.items || []
      }))
    );

    const input = {
      mainDrawerBalance: {
        'CASH': 0,
        'AMERICAN EXPRESS': 0,
        'DEBIT': 0,
        'DISCOVER': 0,
        'MASTER CARD': 0,
        'VISA': 0,
        'CHECK': 0,
        'CASH PASS': 0
      },
      occurredAt: customDate,
      note: 'Test close'
    };

    await useCase.execute(input, clerkUserId);

    // All transactions should use the custom timestamp
    mockStoreTransactionRepo.create.mock.calls.forEach(([tx]) => {
      expect(tx.occurredAt).toEqual(new Date(customDate));
      expect(tx.note).toBe('Test close');
    });
  });
});

