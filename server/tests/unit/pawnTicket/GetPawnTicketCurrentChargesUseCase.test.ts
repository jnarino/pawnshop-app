import { GetPawnTicketCurrentChargesUseCase } from '../../../src/application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { ListPawnTicketsByControlNumberUseCase } from '../../../src/application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';
import { GetPawnTicketPaymentsUseCase } from '../../../src/application/use-case/pawnTicketPayment/query/GetPawnTicketPaymentsUseCase';

describe('GetPawnTicketCurrentChargesUseCase', () => {
    let listByControlNumberUseCase: jest.Mocked<ListPawnTicketsByControlNumberUseCase>;
    let paymentsUseCase: jest.Mocked<GetPawnTicketPaymentsUseCase>;
    let useCase: GetPawnTicketCurrentChargesUseCase;

    beforeEach(() => {
        listByControlNumberUseCase = {
            execute: jest.fn(),
        } as any;
        paymentsUseCase = {
            execute: jest.fn(),
        } as any;
        useCase = new GetPawnTicketCurrentChargesUseCase(listByControlNumberUseCase, paymentsUseCase);
    });

    it('charges 1 period if less than 30 days', async () => {
        const mockTicket = {
            id: 'pawn-1',
            controlNumber: 'PAWN-1',
            transactionType: 'PAWN' as const,
            customerId: 'cust-1',
            clerkUserId: '',
            amountFinanced: 200,
            originalPawnAmount: 200,
            periodicRate: 0.25,
            apr: 0,
            purchaseTradeValue: null,
            transactionDate: '2025-12-01T00:00:00.000Z',
            maturityDate: '2025-12-31T00:00:00.000Z', // 30 days
            defaultDate: '2026-01-31T00:00:00.000Z',
            createdDate: '2025-12-01T00:00:00.000Z',
            pawnStatus: 'P' as const,
            items: [],
            tenders: []
        };
        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue([]);
        // Check on day 10
        const result = await useCase.execute({ controlNumber: 'PAWN-1', referenceDate: new Date('2025-12-11T00:00:00.000Z') });
        expect(result).toEqual({
            pawnTicketId: 'pawn-1',
            currentCharges: 50,
            pawnAmount: 200,
            periodsBehind: 1,
            redemptionAmount: 250
        });
    });

    it('charges 2 periods if more than 30 and less than 60 days', async () => {
        const mockTicket = {
            id: 'pawn-2',
            controlNumber: 'PAWN-2',
            transactionType: 'PAWN' as const,
            customerId: 'cust-2',
            clerkUserId: '',
            amountFinanced: 200,
            originalPawnAmount: 200,
            periodicRate: 0.25,
            apr: 0,
            purchaseTradeValue: null,
            transactionDate: '2025-12-01T00:00:00.000Z',
            maturityDate: '2026-01-25T00:00:00.000Z', // 55 days
            defaultDate: '2026-02-25T00:00:00.000Z',
            createdDate: '2025-12-01T00:00:00.000Z',
            pawnStatus: 'P' as const,
            items: [],
            tenders: []
        };
        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue([]);
        // Check on day 40
        const result = await useCase.execute({ controlNumber: 'PAWN-2', referenceDate: new Date('2026-01-10T00:00:00.000Z') });
        expect(result).toEqual({
            pawnTicketId: 'pawn-2',
            currentCharges: 100,
            pawnAmount: 200,
            periodsBehind: 2,
            redemptionAmount: 300
        });
    });

    it('charges 2 periods plus prorated for 1 day after 60 days', async () => {
        const mockTicket = {
            id: 'pawn-3',
            controlNumber: 'PAWN-3',
            transactionType: 'PAWN' as const,
            customerId: 'cust-3',
            clerkUserId: '',
            amountFinanced: 200,
            originalPawnAmount: 200,
            periodicRate: 0.25,
            apr: 0,
            purchaseTradeValue: null,
            transactionDate: '2025-12-01T00:00:00.000Z',
            maturityDate: '2026-01-31T00:00:00.000Z', // 61 days
            defaultDate: '2026-02-28T00:00:00.000Z',
            createdDate: '2025-12-01T00:00:00.000Z',
            pawnStatus: 'P' as const,
            items: [],
            tenders: []
        };
        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue([]);
        // Check on day 61
        const result = await useCase.execute({ controlNumber: 'PAWN-3', referenceDate: new Date('2026-01-31T00:00:00.000Z') });
        expect(result).toEqual({
            pawnTicketId: 'pawn-3',
            currentCharges: 150,
            pawnAmount: 200,
            periodsBehind: 3,
            redemptionAmount: 301.67
        });
    });
});
