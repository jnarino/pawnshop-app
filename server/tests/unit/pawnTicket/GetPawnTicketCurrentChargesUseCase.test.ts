
import { GetPawnTicketCurrentChargesUseCase } from '../../../src/application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { ListPawnTicketsByControlNumberUseCase } from '../../../src/application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';
import { GetPawnTicketPaymentsUseCase } from '../../../src/application/use-case/pawnTicketPayment/query/GetPawnTicketPaymentsUseCase';

const mockTicket = {
  id: 'ticket-1',
  controlNumber: 'CTRL-123',
  amountFinanced: 250,
  financeCharge: 62.5,
  periodicRate: 0.25,
  transactionDate: '2025-01-01T00:00:00Z',
  maturityDate: '2025-04-01T00:00:00Z',
  defaultDate: '2025-07-01T00:00:00Z',
  createdDate: '2025-01-01T00:00:00Z',
  transactionType: 'PAWN',
  customerId: 'cust-1',
  clerkUserId: 'clerk-1',
  totalOfPayments: 0,
  apr: 0.25,
  ratePlanId: null,
  purchaseTradeValue: null,
  pawnStatus: 'P',
  items: [],
  tenders: [],
  note: null
};

describe('GetPawnTicketCurrentChargesUseCase', () => {
  let listByControlNumberUseCase: jest.Mocked<ListPawnTicketsByControlNumberUseCase>;
  let paymentsUseCase: jest.Mocked<GetPawnTicketPaymentsUseCase>;
  let useCase: GetPawnTicketCurrentChargesUseCase;

  beforeEach(() => {
    listByControlNumberUseCase = {
      execute: jest.fn().mockResolvedValue([mockTicket]),
    } as any;
    paymentsUseCase = {
      execute: jest.fn().mockResolvedValue([
        { pawnTicketId: 'ticket-1', paymentDate: '2025-02-01T00:00:00Z', principalPaid: 62.5, clerkUserId: 'A' },
        { pawnTicketId: 'ticket-1', paymentDate: '2025-03-01T00:00:00Z', principalPaid: 62.5, clerkUserId: 'B' },
      ]),
    } as any;
    useCase = new GetPawnTicketCurrentChargesUseCase(listByControlNumberUseCase, paymentsUseCase);
  });

  it('calculates current charges, pawn amount, periods behind, and redemption', async () => {
    const result = await useCase.execute({ controlNumber: 'CTRL-123' });
    expect(result.pawnTicketId).toBe('ticket-1');
    expect(typeof result.currentCharges).toBe('number');
    expect(typeof result.pawnAmount).toBe('number');
    expect(typeof result.periodsBehind).toBe('number');
    expect(typeof result.redemptionAmount).toBe('number');
  });

  it('throws if ticket not found', async () => {
    listByControlNumberUseCase.execute.mockResolvedValueOnce([]);
    await expect(useCase.execute({ controlNumber: 'NOTFOUND' })).rejects.toThrow('Pawn ticket not found');
  });
});
