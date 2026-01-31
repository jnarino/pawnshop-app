import { IncreasePawnTicketUseCase } from '../../../../../../src/application/use-case/pawnTicket/command/IncreasePawnTicketUseCase';
import { NotFoundError, ValidationError } from '../../../../../../src/application/common/errors';

describe('IncreasePawnTicketUseCase', () => {
    let mockPawnTicketRepo: any;
    let mockInventoryRepo: any;
    let mockStoreTxRepo: any;
    let mockUoW: any;
    let useCase: IncreasePawnTicketUseCase;

    const mockTicketId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCustomerId = '550e8400-e29b-41d4-a716-446655440001';
    const mockClerkId = '550e8400-e29b-41d4-a716-446655440002';
    const mockItem1Id = '550e8400-e29b-41d4-a716-446655440003';
    const mockItem2Id = '550e8400-e29b-41d4-a716-446655440004';

    beforeEach(() => {
        mockPawnTicketRepo = {
            findById: jest.fn(),
            updateAmount: jest.fn()
        };
        mockInventoryRepo = {
            findById: jest.fn(),
            update: jest.fn()
        };
        mockStoreTxRepo = {
            create: jest.fn()
        };
        
        mockUoW = {
            runInTransaction: jest.fn(async (cb) => {
                return cb({
                    pawnTicketRepository: mockPawnTicketRepo,
                    inventoryItemRepository: mockInventoryRepo,
                    storeTransactionRepository: mockStoreTxRepo,
                });
            })
        };

        useCase = new IncreasePawnTicketUseCase(mockUoW);
    });

    it('should successfully increase pawn ticket amount and create store transaction', async () => {
        // Arrange
        const currentAmount = 100;
        const newAmount = 150;
        const difference = 50;
        
        const mockTicket = {
            id: mockTicketId,
            controlNumber: 'PAWN-100',
            amountFinanced: currentAmount,
            customerId: mockCustomerId
        };

        const mockItem1 = { id: mockItem1Id, priceAmount: 40 };
        const mockItem2 = { id: mockItem2Id, priceAmount: 60 };

        mockPawnTicketRepo.findById.mockResolvedValue(mockTicket);
        mockInventoryRepo.findById.mockImplementation(async (id: string) => {
            if (id === mockItem1Id) return { ...mockItem1 };
            if (id === mockItem2Id) return { ...mockItem2 };
            return null;
        });

        const input = {
            id: mockTicketId,
            customerId: mockCustomerId,
            amountFinanced: newAmount,
            clerkUserId: mockClerkId,
            items: [
                { id: mockItem1Id, priceAmount: 60 }, // increased
                { id: mockItem2Id, priceAmount: 90 }  // increased
            ]
        };

        // Act
        await useCase.execute(input);

        // Assert
        expect(mockPawnTicketRepo.findById).toHaveBeenCalledWith(mockTicketId);
        
        // Check Ticket Update
        expect(mockPawnTicketRepo.updateAmount).toHaveBeenCalledWith(mockTicketId, newAmount);

        // Check Inventory updates
        expect(mockInventoryRepo.update).toHaveBeenCalledTimes(2);
        // We can check if the logic updated the object before calling update
        // Since strict object equality might fail if we passed a spread copy, 
        // we check calls arguments
        const updateCall1 = mockInventoryRepo.update.mock.calls[0][0];
        const updateCall2 = mockInventoryRepo.update.mock.calls[1][0];
        // Order depends on input array order
        expect(updateCall1.priceAmount).toBe(60);
        expect(updateCall2.priceAmount).toBe(90);

        // Check Store Transaction
        expect(mockStoreTxRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            typeId: 5, // PAWN (loan cash out)
            amount: difference, // 50
            pawnTicketId: mockTicketId,
            controlNumber: 'PAWN-100',
            clerkUserId: mockClerkId,
            tenders: expect.arrayContaining([
                expect.objectContaining({
                    tenderTypeId: 1, // CASH
                    amount: difference
                })
            ])
        }));
    });

    it('should throw NotFoundError if pawn ticket does not exist', async () => {
        mockPawnTicketRepo.findById.mockResolvedValue(null);

        const input = {
            id: mockTicketId,
            customerId: mockCustomerId,
            amountFinanced: 150,
            clerkUserId: mockClerkId,
            items: []
        };

        await expect(useCase.execute(input))
            .rejects
            .toThrow(NotFoundError);
            
        expect(mockPawnTicketRepo.updateAmount).not.toHaveBeenCalled();
        expect(mockStoreTxRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if new amount is not greater than current amount', async () => {
        const mockTicket = {
            id: mockTicketId,
            amountFinanced: 100
        };
        mockPawnTicketRepo.findById.mockResolvedValue(mockTicket);

        const input = {
            id: mockTicketId,
            customerId: mockCustomerId,
            amountFinanced: 90, // Less than current
            clerkUserId: mockClerkId,
            items: []
        };

        await expect(useCase.execute(input))
            .rejects
            .toThrow(ValidationError);

        expect(mockPawnTicketRepo.updateAmount).not.toHaveBeenCalled();
        expect(mockStoreTxRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if new amount is same as current amount', async () => {
        const mockTicket = {
            id: mockTicketId,
            amountFinanced: 100
        };
        mockPawnTicketRepo.findById.mockResolvedValue(mockTicket);

        const input = {
            id: mockTicketId,
            customerId: mockCustomerId,
            amountFinanced: 100, // Same
            clerkUserId: mockClerkId,
            items: []
        };

        await expect(useCase.execute(input))
            .rejects
            .toThrow(ValidationError);
    });

    it('should successfully increase pawn ticket amount with specific tenders', async () => {
        // Arrange
        const currentAmount = 100;
        const newAmount = 150;
        const difference = 50;
        
        const mockTicket = {
            id: mockTicketId,
            controlNumber: 'PAWN-100',
            amountFinanced: currentAmount,
            customerId: mockCustomerId
        };

        mockPawnTicketRepo.findById.mockResolvedValue(mockTicket);
        mockInventoryRepo.findById.mockResolvedValue({});

        const input = {
            id: mockTicketId,
            customerId: mockCustomerId,
            amountFinanced: newAmount,
            clerkUserId: mockClerkId,
            items: [],
            tenders: [
                { tenderTypeId: 1, amount: 20 },
                { tenderTypeId: 2, amount: 30 }
            ]
        };

        // Act
        await useCase.execute(input);

        // Assert
        expect(mockStoreTxRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: difference,
            tenders: expect.arrayContaining([
                expect.objectContaining({ tenderTypeId: 1, amount: 20 }),
                expect.objectContaining({ tenderTypeId: 2, amount: 30 })
            ])
        }));
    });

    it('should throw validation error if tenders do not match difference', async () => {
         // Arrange
        const currentAmount = 100;
        const newAmount = 150;
        const difference = 50;
        
        const mockTicket = {
            id: mockTicketId,
            controlNumber: 'PAWN-100',
            amountFinanced: currentAmount,
            customerId: mockCustomerId
        };

        mockPawnTicketRepo.findById.mockResolvedValue(mockTicket);

        const input = {
            id: mockTicketId,
            customerId: mockCustomerId,
            amountFinanced: newAmount, // Increase by 50
            clerkUserId: mockClerkId,
            items: [],
            tenders: [
                { tenderTypeId: 1, amount: 10 } // Only 10 provided, needs 50
            ]
        };

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
});
