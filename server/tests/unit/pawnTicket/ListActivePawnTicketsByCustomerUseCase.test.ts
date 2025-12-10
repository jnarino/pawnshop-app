import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { ListActivePawnTicketsByCustomerUseCase } from '../../../src/application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase';

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
}

describe('ListActivePawnTicketsByCustomerUseCase', () => {
  it('should return only active tickets for a customer', async () => {
    const repo = new MockPawnTicketRepository();
    const activeTickets = [
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
      })
    ];
    repo.listActiveByCustomer.mockResolvedValue(activeTickets);

    const useCase = new ListActivePawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: 'cust-123' });

    expect(repo.listActiveByCustomer).toHaveBeenCalledWith('cust-123');
    expect(result).toHaveLength(1);
    expect(result[0].pawnStatus).toBe('active');
  });

  it('should return empty array when customer has no active tickets', async () => {
    const repo = new MockPawnTicketRepository();
    repo.listActiveByCustomer.mockResolvedValue([]);

    const useCase = new ListActivePawnTicketsByCustomerUseCase(repo);

    const result = await useCase.execute({ customerId: 'cust-456' });

    expect(result).toHaveLength(0);
  });
});
