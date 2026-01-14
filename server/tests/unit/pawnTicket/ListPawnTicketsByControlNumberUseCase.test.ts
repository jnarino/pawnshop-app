import { ListPawnTicketsByControlNumberUseCase } from "../../../src/application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase";
import { PawnTicket } from "../../../src/domains/pawnTicket/PawnTicket";
import { PawnTicketRepository } from "../../../src/domains/pawnTicket/PawnTicketRepository";

class MockPawnTicketRepository implements PawnTicketRepository {
  addPayment = jest.fn();
  setStatus = jest.fn();
  updateMarkings = jest.fn();
  findStatusIdByCode = jest.fn();
  setStatusByCode = jest.fn();
  create = jest.fn();
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  findByDateRange = jest.fn();
  listActiveByCustomer = jest.fn();
  listPreviousItemsByCustomer = jest.fn();
  listHistoryByCustomer = jest.fn();
  updatePaymentFields = jest.fn();
  findById = jest.fn(async (id: string) => null);
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
        clerkUserId: 'user-1',
        amountFinanced: 500,
        originalPawnAmount: 500,
        periodicRate: 0.25,
        apr: 25,
        purchaseTradeValue: null,
        transactionDate: new Date(),
        maturityDate: new Date(),
        defaultDate: new Date(),
        createdDate: new Date(),
        pawnStatus: 'P',
        itemIds: ['item-1'],
        tenders: [{ tenderTypeId: 1, amount: 500 }]
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
