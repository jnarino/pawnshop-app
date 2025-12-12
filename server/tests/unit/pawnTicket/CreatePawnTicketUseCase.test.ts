import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { CreatePawnTicketUseCase } from '../../../src/application/use-case/pawnTicket/command/CreatePawnTicketUseCase';

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn(async (t: PawnTicket) => ({
    ...t,
    controlNumber: 'CTL-001'
  }));
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
}

describe('CreatePawnTicketUseCase', () => {
  const customerId1 = '550e8400-e29b-41d4-a716-446655440050';
  const customerId2 = '550e8400-e29b-41d4-a716-446655440051';
  const customerId3 = '550e8400-e29b-41d4-a716-446655440052';
  const clerkUserId = '550e8400-e29b-41d4-a716-446655440053';
  const itemId1 = '550e8400-e29b-41d4-a716-446655440054';
  const itemId2 = '550e8400-e29b-41d4-a716-446655440055';
  const itemId3 = '550e8400-e29b-41d4-a716-446655440056';
  const itemId4 = '550e8400-e29b-41d4-a716-446655440057';

  it('should create a pawn transaction', async () => {
    const repo = new MockPawnTicketRepository();
    const useCase = new CreatePawnTicketUseCase(repo);

    const today = new Date();
    const maturity = new Date(today);
    maturity.setDate(maturity.getDate() + 30);
    const defaultDate = new Date(maturity);
    defaultDate.setDate(defaultDate.getDate() + 30);

    const result = await useCase.execute({
      transactionType: 'PAWN',
      customerId: customerId1,
      clerkUserId: clerkUserId,
      amountFinanced: 500,
      transactionDate: today.toISOString(),
      maturityDate: maturity.toISOString(),
      defaultDate: defaultDate.toISOString(),
      itemIds: [itemId1, itemId2],
      tenders: [{ tenderTypeId: 1, amount: 500 }]
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.transactionType).toBe('PAWN');
    expect(result.amountFinanced).toBe(500);
    expect(result.itemIds).toEqual([itemId1, itemId2]);
  });

  it('should create a purchase transaction', async () => {
    const repo = new MockPawnTicketRepository();
    const useCase = new CreatePawnTicketUseCase(repo);

    const today = new Date();
    const maturity = new Date(today);
    maturity.setDate(maturity.getDate() + 30);
    const defaultDate = new Date(maturity);
    defaultDate.setDate(defaultDate.getDate() + 30);

    const result = await useCase.execute({
      transactionType: 'PURCHASE',
      customerId: customerId2,
      clerkUserId: clerkUserId,
      purchaseTradeValue: 300,
      transactionDate: today.toISOString(),
      maturityDate: maturity.toISOString(),
      defaultDate: defaultDate.toISOString(),
      itemIds: [itemId3],
      tenders: [{ tenderTypeId: 1, amount: 300 }]
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.transactionType).toBe('PURCHASE');
    expect(result.purchaseTradeValue).toBe(300);
  });

  it('should set pawn status to active by default', async () => {
    const repo = new MockPawnTicketRepository();
    const useCase = new CreatePawnTicketUseCase(repo);

    const today = new Date();
    const maturity = new Date(today);
    maturity.setDate(maturity.getDate() + 30);
    const defaultDate = new Date(maturity);
    defaultDate.setDate(defaultDate.getDate() + 30);

    const result = await useCase.execute({
      transactionType: 'PAWN',
      customerId: customerId3,
      clerkUserId: clerkUserId,
      amountFinanced: 1000,
      transactionDate: today.toISOString(),
      maturityDate: maturity.toISOString(),
      defaultDate: defaultDate.toISOString(),
      itemIds: [itemId4],
      tenders: [{ tenderTypeId: 1, amount: 1000 }]
    });

    expect(result.pawnStatus).toBe('active');
  });
});
