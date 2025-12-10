import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { ListPawnTicketsByCustomerUseCase } from '../../../src/application/use-case/pawnTicket/query/ListPawnTicketsByCustomerUseCase';

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
}

describe('ListPawnTicketsByCustomerUseCase', () => {
  it('should return all tickets for a customer', async () => {
    const repo = new MockPawnTicketRepository();
    const tickets = [
      new PawnTicket({
        id: '1',
        controlNumber: 'CTL-001',
        transactionType: 'PAWN',
        customerId: 'cust-123',
        amountFinanced: 500,
        purchaseTradeValue: null,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        pawnStatus: 'active',
        itemIds: ['item-1']
      }),
      new PawnTicket({
        id: '2',
        controlNumber: 'CTL-002',
        transactionType: 'PURCHASE',
        customerId: 'cust-123',
        amountFinanced: null,
        purchaseTradeValue: 300,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        pawnStatus: 'redeemed',
        itemIds: ['item-2']
      })
    ];
    repo.findByCustomer.mockResolvedValue(tickets);

    const useCase = new ListPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: 'cust-123' });

    expect(repo.findByCustomer).toHaveBeenCalledWith('cust-123');
    expect(result).toHaveLength(2);
    expect(result[0].customerId).toBe('cust-123');
    expect(result[1].customerId).toBe('cust-123');
  });

  it('should return empty array when customer has no tickets', async () => {
    const repo = new MockPawnTicketRepository();
    repo.findByCustomer.mockResolvedValue([]);

    const useCase = new ListPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: 'cust-999' });

    expect(result).toHaveLength(0);
  });
});
