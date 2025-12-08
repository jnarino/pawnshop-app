import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { FindPawnTicketsByCustomerUseCase } from '../../../src/application/use-case/pawnTicket/query/FindPawnTicketsByCustomerUseCase';

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
}

describe('FindPawnTicketsByCustomerUseCase', () => {
  it('should find all tickets for a customer', async () => {
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
        transactionType: 'PAWN',
        customerId: 'cust-123',
        amountFinanced: 300,
        purchaseTradeValue: null,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        pawnStatus: 'defaulted',
        itemIds: ['item-2']
      })
    ];
    repo.findByCustomer.mockResolvedValue(tickets);

    const useCase = new FindPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: 'cust-123' });

    expect(repo.findByCustomer).toHaveBeenCalledWith('cust-123');
    expect(result).toHaveLength(2);
  });

  it('should return empty array when customer not found', async () => {
    const repo = new MockPawnTicketRepository();
    repo.findByCustomer.mockResolvedValue([]);

    const useCase = new FindPawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: 'cust-999' });

    expect(result).toHaveLength(0);
  });
});
