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
            customer: {
                firstName: 'John',
                lastName: 'Doe'
            },
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
            itemIds: [],
            items: []
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
            customer: {
                firstName: 'Jane',
                lastName: 'Smith'
            },
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
            itemIds: [],
            items: []
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
            customer: {
                firstName: 'Alice',
                lastName: 'Brown'
            },
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
            itemIds: [],
            items: []
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

    it('handles long history with voids and multi-month pays', async () => {
        const mockTicket = {
            id: 'pawn-long',
            controlNumber: 'PAWN-LONG',
            transactionType: 'PAWN' as const,
            customerId: 'cust-long',
            customer: { firstName: 'Long', lastName: 'History' },
            clerkUserId: '',
            amountFinanced: 120,
            originalPawnAmount: 120,
            periodicRate: 0.25,
            apr: 0,
            purchaseTradeValue: null,
            transactionDate: '2025-12-08T12:13:00.000Z',
            maturityDate: '2022-09-17T00:00:00.000Z',
            defaultDate: '2026-02-06T00:00:00.000Z',
            createdDate: '2022-07-19T15:54:00.000Z',
            pawnStatus: 'P' as const,
            itemIds: [],
            items: []
        };

        const payments = [
            { paymentDate: '2025-12-08T12:13:34.000Z', principalPaid: 30 },
            { paymentDate: '2025-11-05T13:46:47.000Z', principalPaid: 30 },
            { paymentDate: '2025-10-06T14:12:48.000Z', principalPaid: 30 },
            { paymentDate: '2025-10-06T14:12:33.000Z', principalPaid: -30 },
            { paymentDate: '2025-10-06T14:03:51.000Z', principalPaid: 30 },
            { paymentDate: '2025-09-05T10:24:57.000Z', principalPaid: 30 },
            { paymentDate: '2025-08-04T15:37:53.000Z', principalPaid: 30 },
            { paymentDate: '2025-07-07T17:32:35.000Z', principalPaid: 30 },
            { paymentDate: '2025-06-07T14:21:37.000Z', principalPaid: 30 },
            { paymentDate: '2025-05-02T13:38:30.000Z', principalPaid: 30 },
            { paymentDate: '2025-04-02T13:15:57.000Z', principalPaid: 30 },
            { paymentDate: '2025-02-13T10:12:18.000Z', principalPaid: 30 },
            { paymentDate: '2025-01-07T12:20:16.000Z', principalPaid: 30 },
            { paymentDate: '2024-11-27T10:57:30.000Z', principalPaid: 60 },
            { paymentDate: '2024-10-01T14:54:31.000Z', principalPaid: 30 },
            { paymentDate: '2024-08-08T12:57:22.000Z', principalPaid: 60 },
            { paymentDate: '2024-05-30T16:54:16.000Z', principalPaid: 90 },
            { paymentDate: '2024-04-17T11:36:40.000Z', principalPaid: 30 },
            { paymentDate: '2024-02-22T10:24:50.000Z', principalPaid: 30 },
            { paymentDate: '2024-02-22T10:23:09.000Z', principalPaid: 90 },
            { paymentDate: '2024-01-15T11:59:57.000Z', principalPaid: 30 },
            { paymentDate: '2023-12-13T14:29:38.000Z', principalPaid: 30 },
            { paymentDate: '2023-11-15T17:12:13.000Z', principalPaid: 30 },
            { paymentDate: '2023-10-14T15:33:39.000Z', principalPaid: 30 },
            { paymentDate: '2023-09-08T16:57:23.000Z', principalPaid: 30 },
            { paymentDate: '2023-08-08T14:32:42.000Z', principalPaid: 30 },
            { paymentDate: '2023-07-05T11:44:45.000Z', principalPaid: 30 },
            { paymentDate: '2023-06-06T11:58:03.000Z', principalPaid: 60 },
            { paymentDate: '2023-05-04T15:28:11.000Z', principalPaid: 30 },
            { paymentDate: '2023-04-03T09:55:17.000Z', principalPaid: 30 },
            { paymentDate: '2023-02-06T15:21:50.000Z', principalPaid: 30 },
            { paymentDate: '2023-01-06T15:11:51.000Z', principalPaid: 30 },
            { paymentDate: '2022-11-10T17:25:13.000Z', principalPaid: 30 },
            { paymentDate: '2022-09-22T15:19:55.000Z', principalPaid: 30 },
            { paymentDate: '2022-07-19T15:54:52.000Z', principalPaid: -120 }
        ];

        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue(payments as any);

        const result = await useCase.execute({ controlNumber: 'PAWN-LONG', referenceDate: new Date('2026-01-08T00:00:00.000Z') });

        expect(result).toEqual({
            pawnTicketId: 'pawn-long',
            currentCharges: 120,
            pawnAmount: 120,
            periodsBehind: 4,
            redemptionAmount: 219
        });
    });

});
