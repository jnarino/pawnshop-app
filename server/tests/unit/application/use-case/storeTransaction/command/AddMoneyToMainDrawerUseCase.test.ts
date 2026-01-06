import { AddMoneyToMainDrawerUseCase } from '../../../../../../src/application/use-case/storeTransaction/command/AddMoneyToMainDrawerUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { TenderTypeRepository } from '../../../../../../src/domains/tenderType/TenderTypeRepository';
import { TenderType } from '../../../../../../src/domains/tenderType/TenderType';
import { ValidationError } from '../../../../../../src/application/common/errors';

describe('AddMoneyToMainDrawerUseCase', () => {
  let storeTransactionRepo: jest.Mocked<StoreTransactionRepository>;
  let tenderTypeRepo: jest.Mocked<TenderTypeRepository>;
  let useCase: AddMoneyToMainDrawerUseCase;

  const mockTenderTypes = [
    new TenderType(1, 'CASH', '1001', true),
    new TenderType(2, 'AMERICAN EXPRESS', '35001', true),
    new TenderType(7, 'CHECK', '287001', true)
  ];

  beforeEach(() => {
    storeTransactionRepo = {
      create: jest.fn(),
      createPayment: jest.fn(),
      listByCustomer: jest.fn(),
      listByDateRange: jest.fn()
    } as any;

    tenderTypeRepo = {
      findAllActive: jest.fn()
    } as any;

    tenderTypeRepo.findAllActive.mockResolvedValue(mockTenderTypes);
    useCase = new AddMoneyToMainDrawerUseCase(storeTransactionRepo, tenderTypeRepo);
  });

  it('creates withdrawal from bank with type 26 when isFromBank=true and tender=CASH', async () => {
    storeTransactionRepo.create.mockImplementation(async (tx: any) => tx);

    const input = {
      amount: 500,
      transactionTenderName: 'CASH',
      isFromBank: true,
      note: 'Bank withdrawal',
      occurredAt: '2025-01-02T10:00:00.000Z'
    };
    const clerkUserId = 'clerk-1';

    const result = await useCase.execute(input, clerkUserId);

    expect(tenderTypeRepo.findAllActive).toHaveBeenCalled();
    expect(storeTransactionRepo.create).toHaveBeenCalledTimes(1);
    
    const passedTx = storeTransactionRepo.create.mock.calls[0][0];
    expect(passedTx.typeId).toBe(26); // WITHDRAWAL FROM BANK
    expect(passedTx.amount).toBe(500);
    expect(passedTx.clerkUserId).toBe(clerkUserId);
    expect(passedTx.note).toBe('Bank withdrawal');

    expect(passedTx.tenders).toHaveLength(1);
    expect(passedTx.tenders[0].tenderTypeId).toBe(1); // CASH
    expect(passedTx.tenders[0].amount).toBe(500);

    expect(result).toBe(passedTx);
  });

  it('creates cash added main with type 24 when isFromBank=false and tender=CHECK', async () => {
    storeTransactionRepo.create.mockImplementation(async (tx: any) => tx);

    const input = {
      amount: 200,
      transactionTenderName: 'CHECK',
      isFromBank: false,
      note: 'Check deposit'
    };
    const clerkUserId = 'clerk-2';

    const result = await useCase.execute(input, clerkUserId);

    const passedTx = storeTransactionRepo.create.mock.calls[0][0];
    expect(passedTx.typeId).toBe(24); // CASH ADDED - MAIN
    expect(passedTx.amount).toBe(200);
    expect(passedTx.tenders[0].tenderTypeId).toBe(7); // CHECK
    expect(passedTx.tenders[0].amount).toBe(200);
  });

  it('rejects non-CASH tender when isFromBank=true', async () => {
    const input = {
      amount: 300,
      transactionTenderName: 'CHECK',
      isFromBank: true
    };
    const clerkUserId = 'clerk-3';

    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow(ValidationError);
    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow(
      'CHECK type cannot be added from bank to main drawer'
    );
    expect(storeTransactionRepo.create).not.toHaveBeenCalled();
  });

  it('rejects invalid tender type name', async () => {
    const input = {
      amount: 100,
      transactionTenderName: 'INVALID_TENDER',
      isFromBank: false
    };
    const clerkUserId = 'clerk-4';

    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow(ValidationError);
    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow(
      'Invalid tender type: INVALID_TENDER'
    );
  });

  it('enforces positive amount', async () => {
    const input = {
      amount: 0,
      transactionTenderName: 'CASH',
      isFromBank: false
    };
    const clerkUserId = 'clerk-5';

    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow();
    expect(storeTransactionRepo.create).not.toHaveBeenCalled();
  });

  it('handles case-insensitive tender type matching', async () => {
    storeTransactionRepo.create.mockImplementation(async (tx: any) => tx);

    const input = {
      amount: 150,
      transactionTenderName: 'cash', // lowercase
      isFromBank: true
    };
    const clerkUserId = 'clerk-6';

    const result = await useCase.execute(input, clerkUserId);

    const passedTx = storeTransactionRepo.create.mock.calls[0][0];
    expect(passedTx.tenders[0].tenderTypeId).toBe(1); // CASH
  });
});
