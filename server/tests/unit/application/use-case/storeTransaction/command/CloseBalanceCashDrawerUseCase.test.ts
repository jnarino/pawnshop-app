import { CloseBalanceCashDrawerUseCase } from '../../../../../../src/application/use-case/storeTransaction/command/CloseBalanceCashDrawerUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { TenderTypeRepository } from '../../../../../../src/domains/tenderType/TenderTypeRepository';

describe('CloseBalanceCashDrawerUseCase', () => {
  let storeTransactionRepo: jest.Mocked<StoreTransactionRepository>;
  let tenderTypeRepo: jest.Mocked<TenderTypeRepository>;
  let useCase: CloseBalanceCashDrawerUseCase;

  beforeEach(() => {
    storeTransactionRepo = {
      create: jest.fn().mockImplementation((tx) => Promise.resolve({
        ...tx,
        tenders: tx.tenders || [],
        items: tx.items || []
      }))
    } as any;

    tenderTypeRepo = {} as any;

    useCase = new CloseBalanceCashDrawerUseCase(storeTransactionRepo, tenderTypeRepo);
  });

  it('creates DEPOSIT FROM MAIN (type 22) transactions for each tender with amount', async () => {
    storeTransactionRepo.create.mockImplementation((tx) => Promise.resolve({
      ...tx,
      tenders: tx.tenders || [],
      items: tx.items || []
    } as any));

    await useCase.execute({
      cashBalance: 10333.35,
      tenderAmounts: {
        cash: 10333.35,
        americanExpress: 230.00,
        debit: 3048.80
      }
    }, 'clerk-1');

    // Should create 4 transactions:
    // 1. DEPOSIT FROM MAIN for cash (-10333.35)
    // 2. DEPOSIT FROM MAIN for AMEX (-230.00)
    // 3. DEPOSIT FROM MAIN for debit (-3048.80)
    // 4. MAIN BALANCE (10333.35)
    expect(storeTransactionRepo.create).toHaveBeenCalledTimes(4);
    
    // Check first call (cash deposit)
    const firstCall = storeTransactionRepo.create.mock.calls[0][0];
    expect(firstCall.typeId).toBe(22); // DEPOSIT FROM MAIN
    expect(firstCall.amount).toBe(-10333.35);
    expect(firstCall.tenders).toHaveLength(1);
    expect(firstCall.tenders[0].tenderTypeId).toBe(1); // CASH
    await useCase.execute({
      cashBalance: 10333.35,
      tenderAmounts: {
        cash: 10333.35
      }
    }, 'clerk-1');

    // Last call should be MAIN BALANCE
    const lastCallIndex = storeTransactionRepo.create.mock.calls.length - 1;
    const lastCall = storeTransactionRepo.create.mock.calls[lastCallIndex][0];
    
    expect(lastCall.typeId).toBe(23); // MAIN BALANCE
    expect(lastCall.amount).toBe(10333.35);
    expect(lastCall.tenders).toHaveLength(0);
  });

  it('forces negative amounts for DEPOSIT FROM MAIN transactions', async () => {
    await useCase.execute({
      cashBalance: 1000,
      tenderAmounts: {
        cash: 500, // Positive input
        visa: -200 // Already negative
      }
    }, 'clerk-1');

    // First deposit (cash)
    const firstCall = storeTransactionRepo.create.mock.calls[0][0];
    expect(firstCall.amount).toBe(-500); // Should be negative
    
    // Second deposit (visa)
    const secondCall = storeTransactionRepo.create.mock.calls[1][0];
    expect(secondCall.amount).toBe(-200); // Should still be negative
  });

  it('skips tender types with zero or undefined amounts', async () => {
    await useCase.execute({
      cashBalance: 1000,
      tenderAmounts: {
        cash: 1000,
        americanExpress: 0,
        debit: undefined,
        visa: 100
      }
    }, 'clerk-1');

    // Should create 3 transactions:
    // 1. DEPOSIT for cash
    // 2. DEPOSIT for visa
    // 3. MAIN BALANCE
    expect(storeTransactionRepo.create).toHaveBeenCalledTimes(3);
  });

  it('uses provided occurredAt timestamp for all transactions', async () => {
    const occurredAt = '2025-12-31T18:00:54Z';

    await useCase.execute({
      cashBalance: 1000,
      tenderAmounts: {
        cash: 1000
      },
      occurredAt
    }, 'clerk-1');

    // Check all transactions use the same timestamp
    for (const call of storeTransactionRepo.create.mock.calls) {
      const transaction = call[0];
      expect(transaction.occurredAt).toEqual(new Date(occurredAt));
      expect(transaction.createdAt).toEqual(new Date(occurredAt));
      expect(transaction.updatedAt).toEqual(new Date(occurredAt));
    }
  });

  it('includes note in all transactions', async () => {
    await useCase.execute({
      cashBalance: 1000,
      tenderAmounts: {
        cash: 1000
      },
      note: 'End of day close'
    }, 'clerk-1');

    // Check all transactions have the note
    for (const call of storeTransactionRepo.create.mock.calls) {
      const transaction = call[0];
      expect(transaction.note).toBe('End of day close');
    }
  });

  it('returns array of created transactions', async () => {
    const result = await useCase.execute({
      cashBalance: 1000,
      tenderAmounts: {
        cash: 1000
      }
    }, 'clerk-1');

    expect(result).toHaveLength(2); // 1 deposit + 1 balance
    expect(result[0].typeId).toBe(22);
    expect(result[1].typeId).toBe(23);
  });
});
