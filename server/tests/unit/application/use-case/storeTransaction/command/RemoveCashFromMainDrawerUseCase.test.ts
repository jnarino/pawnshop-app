import { RemoveCashFromMainDrawerUseCase } from '../../../../../../src/application/use-case/storeTransaction/command/RemoveCashFromMainDrawerUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';

describe('RemoveCashFromMainDrawerUseCase', () => {
  let repo: jest.Mocked<StoreTransactionRepository>;
  let useCase: RemoveCashFromMainDrawerUseCase;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      createPayment: jest.fn(),
      listByCustomer: jest.fn(),
      listByDateRange: jest.fn()
    } as any;

    useCase = new RemoveCashFromMainDrawerUseCase(repo);
  });

  it('creates a cash-out transaction with type 25 and CASH tender', async () => {
    repo.create.mockImplementation(async (tx: any) => tx);

    const input = {
      amount: 60,
      note: 'CHEFS CORNER',
      occurredAt: '2025-01-02T10:00:00.000Z'
    };
    const clerkUserId = 'clerk-1';

    const result = await useCase.execute(input, clerkUserId);

    expect(repo.create).toHaveBeenCalledTimes(1);
    const passedTx = repo.create.mock.calls[0][0];

    expect(passedTx.typeId).toBe(25);
    expect(passedTx.amount).toBeCloseTo(-60.0);
    expect(passedTx.clerkUserId).toBe(clerkUserId);
    expect(passedTx.occurredAt.toISOString()).toBe('2025-01-02T10:00:00.000Z');
    expect(passedTx.note).toBe('CHEFS CORNER');

    expect(passedTx.tenders).toHaveLength(1);
    const tender = passedTx.tenders[0];
    expect(tender.tenderTypeId).toBe(1);
    expect(tender.amount).toBeCloseTo(-60.0);
    expect(tender.storeTransactionId).toBe(passedTx.id);

    expect(result).toBe(passedTx);
  });

  it('defaults occurredAt to now and enforces negative amount', async () => {
    repo.create.mockImplementation(async (tx: any) => tx);

    const input = { amount: 50 };
    const clerkUserId = 'clerk-2';

    const before = Date.now();
    const result = await useCase.execute(input, clerkUserId);
    const after = Date.now();

    const passedTx = repo.create.mock.calls[0][0];

    expect(passedTx.amount).toBe(-50);
    expect(passedTx.tenders[0].amount).toBe(-50);
    expect(passedTx.occurredAt.getTime()).toBeGreaterThanOrEqual(before - 5_000);
    expect(passedTx.occurredAt.getTime()).toBeLessThanOrEqual(after + 5_000);
    expect(result).toBe(passedTx);
  });

  it('rejects non-positive amounts', async () => {
    const input = { amount: 0 };
    const clerkUserId = 'clerk-3';

    await expect(useCase.execute(input, clerkUserId)).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });
});
