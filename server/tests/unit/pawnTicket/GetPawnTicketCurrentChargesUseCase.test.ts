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

    it('handles long payment history with multi-period payments', async () => {
        const mockTicket = {
            id: '4304fc45-e63e-4e26-b089-fdbf72065bf8',
            controlNumber: '105749',
            transactionType: 'PAWN' as const,
            customerId: '84921f93-e114-4b40-84e3-af070655fd09',
            clerkUserId: '',
            amountFinanced: 250,
            originalPawnAmount: 250,
            periodicRate: 0.25,
            apr: 304.17,
            purchaseTradeValue: null,
            transactionDate: '2025-12-03T13:34:00.000Z',
            maturityDate: '2025-08-29T00:00:00.000Z',
            defaultDate: '2026-02-01T00:00:00.000Z',
            createdDate: '2021-05-22T14:07:00.000Z',
            pawnStatus: 'P' as const,
            items: [],
            tenders: []
        };

        const paymentHistory = [
            { pawnTicketId: mockTicket.id, paymentDate: '2025-12-03T13:34:49.000Z', principalPaid: 62.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-11-05T11:05:28.000Z', principalPaid: 62.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-10-04T13:26:00.000Z', principalPaid: 62.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-09-04T14:26:35.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-08-04T10:54:42.000Z', principalPaid: 62.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-07-05T11:13:20.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-06-04T11:45:20.000Z', principalPaid: 62.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-05-08T17:27:03.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-04-04T14:37:13.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-03-04T16:51:05.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-02-04T11:50:11.000Z', principalPaid: 62.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-01-06T13:13:05.000Z', principalPaid: 62.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-12-18T14:44:50.000Z', principalPaid: -60, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-12-04T15:24:36.000Z', principalPaid: 47.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-11-05T15:42:32.000Z', principalPaid: 47.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-10-04T16:12:28.000Z', principalPaid: 47.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-09-04T13:43:27.000Z', principalPaid: 47.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-08-03T17:06:39.000Z', principalPaid: 47.5, clerkUserId: 'JM' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-07-05T14:44:48.000Z', principalPaid: 47.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-06-04T13:45:46.000Z', principalPaid: 47.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-05-04T17:09:59.000Z', principalPaid: 47.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-04-04T17:46:59.000Z', principalPaid: 47.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-03-04T16:51:05.000Z', principalPaid: 47.5, clerkUserId: 'JM' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-02-04T11:50:11.000Z', principalPaid: 47.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-01-15T15:04:45.000Z', principalPaid: -40, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-01-04T17:28:19.000Z', principalPaid: 37.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-12-04T13:32:19.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-11-04T13:56:45.000Z', principalPaid: 37.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-10-06T17:26:07.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-09-04T13:09:13.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-08-04T13:41:44.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-07-05T13:36:16.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-06-05T11:47:00.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-05-04T13:55:03.000Z', principalPaid: 37.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-03-04T14:02:30.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-02-08T14:01:47.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-01-04T11:07:39.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-12-03T16:24:28.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-11-04T17:52:24.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-10-05T16:27:51.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-09-06T13:19:55.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-08-05T14:37:15.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-06-04T16:30:37.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-05-03T11:22:52.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-03-09T17:07:38.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-01-04T16:24:57.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-12-03T11:32:23.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-11-05T15:14:35.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-10-04T16:51:24.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-09-03T17:22:50.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-08-04T16:26:54.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-06-15T15:21:04.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-05-22T14:07:59.000Z', principalPaid: -150, clerkUserId: 'JL' }
        ];

        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue(paymentHistory);

        const result = await useCase.execute({ controlNumber: mockTicket.controlNumber, referenceDate: new Date('2025-12-26T19:19:14.227Z') });

        expect(result).toEqual({
            pawnTicketId: mockTicket.id,
            currentCharges: 375,
            pawnAmount: 250,
            periodsBehind: 6,
            redemptionAmount: 622.92
        });
    });

    it('handles long payment history with multi-period payments and more', async () => {
        const mockTicket = {
            id: '4304fc45-e63e-4e26-b089-fdbf72065bf8',
            controlNumber: '105749',
            transactionType: 'PAWN' as const,
            customerId: '84921f93-e114-4b40-84e3-af070655fd09',
            clerkUserId: '',
            amountFinanced: 250,
            originalPawnAmount: 250,
            periodicRate: 0.25,
            apr: 304.17,
            purchaseTradeValue: null,
            transactionDate: '2025-12-03T13:34:00.000Z',
            maturityDate: '2025-08-29T00:00:00.000Z',
            defaultDate: '2026-02-01T00:00:00.000Z',
            createdDate: '2021-05-22T14:07:00.000Z',
            pawnStatus: 'P' as const,
            items: [],
            tenders: []
        };

        const paymentHistory = [
            { pawnTicketId: mockTicket.id, paymentDate: '2025-12-03T13:34:49.000Z', principalPaid: 312.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-11-05T11:05:28.000Z', principalPaid: 62.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-10-04T13:26:00.000Z', principalPaid: 62.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-09-04T14:26:35.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-08-04T10:54:42.000Z', principalPaid: 62.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-07-05T11:13:20.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-06-04T11:45:20.000Z', principalPaid: 62.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-05-08T17:27:03.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-04-04T14:37:13.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-03-04T16:51:05.000Z', principalPaid: 62.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-02-04T11:50:11.000Z', principalPaid: 62.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2025-01-06T13:13:05.000Z', principalPaid: 62.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-12-18T14:44:50.000Z', principalPaid: -60, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-12-04T15:24:36.000Z', principalPaid: 47.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-11-05T15:42:32.000Z', principalPaid: 47.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-10-04T16:12:28.000Z', principalPaid: 47.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-09-04T13:43:27.000Z', principalPaid: 47.5, clerkUserId: 'JN' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-08-03T17:06:39.000Z', principalPaid: 47.5, clerkUserId: 'JM' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-07-05T14:44:48.000Z', principalPaid: 47.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-06-04T13:45:46.000Z', principalPaid: 47.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-05-04T17:09:59.000Z', principalPaid: 47.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-04-04T17:46:59.000Z', principalPaid: 47.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-03-04T16:51:05.000Z', principalPaid: 47.5, clerkUserId: 'JM' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-02-04T11:50:11.000Z', principalPaid: 47.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-01-15T15:04:45.000Z', principalPaid: -40, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2024-01-04T17:28:19.000Z', principalPaid: 37.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-12-04T13:32:19.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-11-04T13:56:45.000Z', principalPaid: 37.5, clerkUserId: 'CPK' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-10-06T17:26:07.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-09-04T13:09:13.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-08-04T13:41:44.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-07-05T13:36:16.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-06-05T11:47:00.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-05-04T13:55:03.000Z', principalPaid: 37.5, clerkUserId: 'CAZ' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-03-04T14:02:30.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-02-08T14:01:47.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2023-01-04T11:07:39.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-12-03T16:24:28.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-11-04T17:52:24.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-10-05T16:27:51.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-09-06T13:19:55.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-08-05T14:37:15.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-06-04T16:30:37.000Z', principalPaid: 37.5, clerkUserId: 'CDC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-05-03T11:22:52.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-03-09T17:07:38.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2022-01-04T16:24:57.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-12-03T11:32:23.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-11-05T15:14:35.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-10-04T16:51:24.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-09-03T17:22:50.000Z', principalPaid: 37.5, clerkUserId: 'JC' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-08-04T16:26:54.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-06-15T15:21:04.000Z', principalPaid: 37.5, clerkUserId: 'JL' },
            { pawnTicketId: mockTicket.id, paymentDate: '2021-05-22T14:07:59.000Z', principalPaid: -150, clerkUserId: 'JL' }
        ];

        listByControlNumberUseCase.execute.mockResolvedValue([mockTicket]);
        paymentsUseCase.execute.mockResolvedValue(paymentHistory);

        const result = await useCase.execute({ controlNumber: mockTicket.controlNumber, referenceDate: new Date('2025-12-26T19:19:14.227Z') });

        expect(result).toEqual({
            pawnTicketId: mockTicket.id,
            currentCharges: 125,
            pawnAmount: 250,
            periodsBehind: 2,
            redemptionAmount: 372.92
        });
    });
});
