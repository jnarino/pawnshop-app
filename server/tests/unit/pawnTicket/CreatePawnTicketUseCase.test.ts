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
      customerId: 'cust-123',
      amountFinanced: 500,
      transactionDate: today.toISOString(),
      maturityDate: maturity.toISOString(),
      defaultDate: defaultDate.toISOString(),
      itemIds: ['item-1', 'item-2']
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.transactionType).toBe('PAWN');
    expect(result.amountFinanced).toBe(500);
    expect(result.itemIds).toEqual(['item-1', 'item-2']);
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
      customerId: 'cust-456',
      purchaseTradeValue: 300,
      transactionDate: today.toISOString(),
      maturityDate: maturity.toISOString(),
      defaultDate: defaultDate.toISOString(),
      itemIds: ['item-3']
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
      customerId: 'cust-789',
      amountFinanced: 1000,
      transactionDate: today.toISOString(),
      maturityDate: maturity.toISOString(),
      defaultDate: defaultDate.toISOString(),
      itemIds: ['item-4']
    });

    expect(result.pawnStatus).toBe('active');
  });
});
