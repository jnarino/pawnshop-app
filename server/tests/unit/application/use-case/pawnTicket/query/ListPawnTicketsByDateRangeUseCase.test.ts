import { ListPawnTicketsByDateRangeUseCase } from '../../../../../../src/application/use-case/pawnTicket/query/ListPawnTicketsByDateRangeUseCase';
import { PawnTicketRepository } from '../../../../../../src/domains/pawnTicket/PawnTicketRepository';
import { GetPawnTicketCurrentChargesUseCase } from '../../../../../../src/application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { PawnTicket } from '../../../../../../src/domains/pawnTicket/PawnTicket';
import { z } from 'zod';

describe('ListPawnTicketsByDateRangeUseCase', () => {
    let useCase: ListPawnTicketsByDateRangeUseCase;
    let mockPawnTicketRepo: jest.Mocked<PawnTicketRepository>;
    let mockGetChargesUseCase: jest.Mocked<GetPawnTicketCurrentChargesUseCase>;

    beforeEach(() => {
        mockPawnTicketRepo = {
            findByDateRange: jest.fn(),
            findById: jest.fn(),
            findByControlNumber: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<PawnTicketRepository>;

        mockGetChargesUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<GetPawnTicketCurrentChargesUseCase>;

        useCase = new ListPawnTicketsByDateRangeUseCase(
            mockPawnTicketRepo,
            mockGetChargesUseCase
        );
    });

    it('should return list of tickets with redemption amount for active pawns', async () => {
        const input = {
            from: '2023-01-01',
            to: '2023-01-31'
        };

        const mockTicket = new PawnTicket({
            id: '1',
            controlNumber: '123',
            transactionType: 'PAWN',
            pawnStatus: 'P', // Active
            customerId: 'c1',
            clerkUserId: 'u1',
            amountFinanced: 100,
            originalPawnAmount: 100,
            periodicRate: 0.1,
            apr: 120,
            purchaseTradeValue: null,
            transactionDate: new Date('2023-01-15T10:00:00.000Z'),
            maturityDate: new Date('2023-02-14'),
            defaultDate: new Date('2023-03-14'),
            createdDate: new Date('2023-01-15'),
            itemIds: ['i1'],
            tenders: []
        });

        // Set the new property manually to ensure it works even if constructor is partial
        // (though we just updated the constructor)
        mockTicket.totalOfPayments = 150;

        mockPawnTicketRepo.findByDateRange.mockResolvedValue([mockTicket]);
        
        mockGetChargesUseCase.execute.mockResolvedValue({
            redemptionAmount: 110.50,
            financeCharges: 10.50,
            serviceCharges: 0,
            lostTicketFee: 0,
            associatedTicketFees: 0,
            isGracePeriod: false,
            daysOverdue: 0
        } as any);

        const result = await useCase.execute(input);

        expect(mockPawnTicketRepo.findByDateRange).toHaveBeenCalled();
        expect(mockGetChargesUseCase.execute).toHaveBeenCalledWith({ controlNumber: '123' });
        
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
        expect(result[0].totalOfPayments).toBe(150);
        expect(result[0].redemptionAmount).toBe(110.50);
    });

    it('should skip charges calculation for non-active tickets', async () => {
        const input = {
            from: '2023-01-01',
            to: '2023-01-31'
        };

        const mockTicket = new PawnTicket({
            id: '2',
            controlNumber: '456',
            transactionType: 'PURCHASE', // Not PAWN
            pawnStatus: 'U', // Redeemed/Closed
            customerId: 'c1',
            clerkUserId: 'u1',
            amountFinanced: null,
            originalPawnAmount: null,
            periodicRate: null,
            apr: null,
            purchaseTradeValue: 50,
            transactionDate: new Date('2023-01-15'),
            maturityDate: new Date('2023-02-14'),
            defaultDate: new Date('2023-03-14'),
            createdDate: new Date('2023-01-15'),
            itemIds: ['i2'],
            tenders: []
        });

        mockPawnTicketRepo.findByDateRange.mockResolvedValue([mockTicket]);

        const result = await useCase.execute(input);

        expect(mockGetChargesUseCase.execute).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
        expect(result[0].redemptionAmount).toBeUndefined();
    });

    it('should handle errors in charges calculation gracefully', async () => {
        const input = {
            from: '2023-01-01',
            to: '2023-01-31'
        };

        const mockTicket = new PawnTicket({
            id: '3',
            controlNumber: '789',
            transactionType: 'PAWN',
            pawnStatus: 'P',
            customerId: 'c1',
            clerkUserId: 'u1',
            amountFinanced: 100,
            originalPawnAmount: 100,
            periodicRate: 0.1,
            apr: 120,
            purchaseTradeValue: null,
            transactionDate: new Date('2023-01-15'),
            maturityDate: new Date('2023-02-14'),
            defaultDate: new Date('2023-03-14'),
            createdDate: new Date('2023-01-15'),
            itemIds: ['i1'],
            tenders: []
        });

        mockPawnTicketRepo.findByDateRange.mockResolvedValue([mockTicket]);
        mockGetChargesUseCase.execute.mockRejectedValue(new Error('Calculation failed'));

        const result = await useCase.execute(input);

        expect(mockGetChargesUseCase.execute).toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0].redemptionAmount).toBeUndefined();
    });
});
