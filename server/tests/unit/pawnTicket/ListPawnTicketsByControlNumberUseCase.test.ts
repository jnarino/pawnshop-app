import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { ListPawnTicketsByControlNumberUseCase } from '../../../src/application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
}

describe('ListPawnTicketsByControlNumberUseCase', () => {
  it('should return tickets matching control number', async () => {
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
      })
    ];
    repo.listByControlNumber.mockResolvedValue(tickets);

    const useCase = new ListPawnTicketsByControlNumberUseCase(repo);

    const result = await useCase.execute({ controlNumber: 'CTL-001' });

    expect(repo.listByControlNumber).toHaveBeenCalledWith('CTL-001');
    expect(result).toHaveLength(1);
    expect(result[0].controlNumber).toBe('CTL-001');
  });

  it('should return empty array when no tickets found', async () => {
    const repo = new MockPawnTicketRepository();
    repo.listByControlNumber.mockResolvedValue([]);

    const useCase = new ListPawnTicketsByControlNumberUseCase(repo);

    const result = await useCase.execute({ controlNumber: 'CTL-999' });

    expect(result).toHaveLength(0);
  });
});
