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
            { paymentDate: '2026-01-08T09:57:35.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-12-08T12:13:34.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-11-05T13:46:47.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-10-06T14:12:48.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-10-06T14:12:33.000Z', principalPaid: -30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-10-06T14:03:51.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-09-05T10:24:57.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-08-04T15:37:53.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-07-07T17:32:35.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-06-07T14:21:37.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-05-02T13:38:30.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-04-02T13:15:57.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-02-13T10:12:18.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-01-07T12:20:16.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-11-27T10:57:30.000Z', principalPaid: 60, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-10-01T14:54:31.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-08-08T12:57:22.000Z', principalPaid: 60, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-05-30T16:54:16.000Z', principalPaid: 90, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-04-17T11:36:40.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-02-22T10:24:50.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-02-22T10:23:09.000Z', principalPaid: 90, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-01-15T11:59:57.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-12-13T14:29:38.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-11-15T17:12:13.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-10-14T15:33:39.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-09-08T16:57:23.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-08-08T14:32:42.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-07-05T11:44:45.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-06-06T11:58:03.000Z', principalPaid: 60, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-05-04T15:28:11.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-04-03T09:55:17.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-02-06T15:21:50.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-01-06T15:11:51.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-11-10T17:25:13.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-09-22T15:19:55.000Z', principalPaid: 30, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-07-19T15:54:52.000Z', principalPaid: -120, transactionTypeName: 'PAWN (loan cash out)' }
        ];

        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue(payments as any);

        const result = await useCase.execute({ controlNumber: 'PAWN-LONG', referenceDate: new Date('2026-01-14T00:00:00.000Z') });

        expect(result).toEqual({
            pawnTicketId: 'pawn-long',
            currentCharges: 90,
            pawnAmount: 120,
            periodsBehind: 3,
            redemptionAmount: 195 
        });
    });

    it('handles recovery and re-pawn scenario with correct charges', async () => {
        const mockTicket = {
            id: 'pawn-recovery',
            controlNumber: 'PAWN-RECOVERY',
            transactionType: 'PAWN' as const,
            customerId: 'cust-recovery',
            customer: { firstName: 'Recovery', lastName: 'Test' },
            clerkUserId: '',
            amountFinanced: 200,
            originalPawnAmount: 200,
            periodicRate: 0.25,
            apr: 0,
            purchaseTradeValue: null,
            transactionDate: '2025-08-06T12:27:51.000Z',
            maturityDate: '2026-02-04T00:00:00.000Z',
            defaultDate: '2026-03-06T00:00:00.000Z',
            // Keep original createdDate - don't modify when it gets defaulted
            createdDate: '2025-08-06T12:27:51.000Z',
            pawnStatus: 'P' as const,
            itemIds: [],
            items: []
        };

        const payments = [
            { paymentDate: '2026-01-03T11:03:21.000Z', principalPaid: 50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-12-17T11:13:12.000Z', principalPaid: 50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-12-08T13:37:50.000Z', principalPaid: 50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-12-08T13:36:31.000Z', principalPaid: -200, transactionTypeName: 'PAWN DEFAULTED (status)' }, // Re-pawn (increase)
            { paymentDate: '2025-12-03T10:09:00.000Z', principalPaid: 200, transactionTypeName: 'PAWN DEFAULTED (status)' }, // Recovery payment
            { paymentDate: '2025-10-03T14:47:29.000Z', principalPaid: 50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-08-06T12:27:51.000Z', principalPaid: -200, transactionTypeName: 'PAWN (loan cash out)' } // Initial pawn (increase)
        ];

        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue(payments as any);

       
        const result = await useCase.execute({ 
            controlNumber: 'PAWN-RECOVERY', 
            referenceDate: new Date('2026-01-14T00:00:00.000Z') 
        });

        // Using current actual behavior for now:
        expect(result).toEqual({
            pawnTicketId: 'pawn-recovery',
            currentCharges: 100,
            pawnAmount: 200,
            periodsBehind: 2,
            redemptionAmount: 268.33
        });
    });

    it('handles multiple pawn increases with long payment history', async () => {
        const mockTicket = {
            id: 'pawn-multiple-increases',
            controlNumber: 'PAWN-105749',
            transactionType: 'PAWN' as const,
            customerId: 'cust-multiple',
            customer: { firstName: 'Multiple', lastName: 'Increases' },
            clerkUserId: '',
            amountFinanced: 250,
            originalPawnAmount: 150,
            periodicRate: 0.25,
            apr: 0,
            purchaseTradeValue: null,
            transactionDate: '2021-05-22T14:07:59.000Z',
            maturityDate: '2026-06-21T00:00:00.000Z',
            defaultDate: '2026-07-21T00:00:00.000Z',
            createdDate: '2021-05-22T14:07:59.000Z',
            pawnStatus: 'P' as const,
            itemIds: [],
            items: []
        };

        const payments = [
            { paymentDate: '2026-01-02T16:11:31.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-12-03T13:34:49.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-11-05T11:05:28.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-10-04T13:26:00.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-09-04T14:26:35.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-08-04T10:54:42.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-07-05T11:13:20.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-06-04T11:45:20.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-05-08T17:27:03.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-04-04T14:37:13.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-03-04T16:51:05.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-02-04T11:50:11.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2025-01-06T13:13:05.000Z', principalPaid: 62.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-12-18T14:44:50.000Z', principalPaid: -60.00, transactionTypeName: 'PAWN (loan cash out)' },
            { paymentDate: '2024-12-04T15:24:36.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-11-05T15:42:32.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-10-04T16:12:28.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-09-04T13:43:27.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-08-03T17:06:39.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-07-05T14:44:48.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-06-04T13:45:46.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-05-04T17:09:59.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-04-04T17:46:59.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-03-02T14:50:01.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-02-03T15:35:49.000Z', principalPaid: 47.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2024-01-15T15:04:45.000Z', principalPaid: -40.00, transactionTypeName: 'PAWN (loan cash out)' },
            { paymentDate: '2024-01-04T17:28:19.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-12-04T13:32:19.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-11-04T13:56:45.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-10-06T17:26:07.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-09-04T13:09:13.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-08-04T13:41:44.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-07-05T13:36:16.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-06-05T11:47:00.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-05-04T13:55:03.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-03-04T14:02:30.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-02-08T14:01:47.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2023-01-04T11:07:39.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-12-03T16:24:28.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-11-04T17:52:24.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-10-05T16:27:51.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-09-06T13:19:55.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-08-05T14:37:15.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-06-04T16:30:37.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-05-03T11:22:52.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-03-09T17:07:38.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2022-01-04T16:24:57.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2021-12-03T11:32:23.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2021-11-05T15:14:35.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2021-10-04T16:51:24.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2021-09-03T17:22:50.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2021-08-04T16:26:54.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2021-06-15T15:21:04.000Z', principalPaid: 37.50, transactionTypeName: 'PAWN PAYMENT (interest/principal)' },
            { paymentDate: '2021-05-22T14:07:59.000Z', principalPaid: -150.00, transactionTypeName: 'PAWN (loan cash out)' }
        ];

        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue(payments as any);

        const result = await useCase.execute({ 
            controlNumber: 'PAWN-105749', 
            referenceDate: new Date('2026-01-14T00:00:00.000Z') 
        });

        expect(result).toEqual({
            pawnTicketId: 'pawn-multiple-increases',
            currentCharges: 375,
            pawnAmount: 250,
            periodsBehind: 6,
            redemptionAmount: 600

        });
        });
    });
