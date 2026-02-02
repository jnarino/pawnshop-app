import { UpdatePawnTicketItemsUseCase } from '../../../src/application/use-case/pawnTicket/command/UpdatePawnTicketItemsUseCase';
import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { NotFoundError, ForbiddenError } from '../../../src/application/common/errors';

describe('UpdatePawnTicketItemsUseCase', () => {
    let useCase: UpdatePawnTicketItemsUseCase;
    let mockInventoryRepo: jest.Mocked<InventoryItemRepository>;
    let mockPawnTicketRepo: jest.Mocked<PawnTicketRepository>;

    beforeEach(() => {
        mockInventoryRepo = {
            findById: jest.fn(),
            findByPawnTicketId: jest.fn(),
            update: jest.fn(),
            // ... other methods needed for interface compliance ...
            create: jest.fn(),
            delete: jest.fn(),
            findByInventoryNumber: jest.fn(),
            findAvailableByInventoryNumber: jest.fn(),
            findBySerialNumber: jest.fn(),
            findByInventoryNumbers: jest.fn(),
            setStatusByPawnTicket: jest.fn(),
            updateStatusAndQuantity: jest.fn(),
            getInventoryNumberById: jest.fn(),
            getNextInventoryNumber: jest.fn(),
        } as any;

        mockPawnTicketRepo = {
            findById: jest.fn(),
        } as any;

        useCase = new UpdatePawnTicketItemsUseCase(mockInventoryRepo, mockPawnTicketRepo);
    });

    const ticketId = '00000000-0000-0000-0000-000000000000';
    const itemId = '11111111-1111-1111-1111-111111111111';
    const otherItemId = '22222222-2222-2222-2222-222222222222';

    const mockItem = new InventoryItem({
        id: itemId,
        inventorySubcategoryId: '33333333-3333-3333-3333-333333333333',
        status: 'P',
        quantity: 1,
        brand: 'Old Brand',
        model: 'Old Model',
        itemDescription: 'Old Desc',
        priceAmount: 100,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    it('should update allowed fields for items belonging to ticket', async () => {
        mockPawnTicketRepo.findById.mockResolvedValue({ id: ticketId } as PawnTicket);
        mockInventoryRepo.findByPawnTicketId.mockResolvedValue([mockItem]);
        
        // Mock findById to return the same item (or could rely on map logic which uses the list)
        // usage: const item = await this.inventoryItemRepo.findById(updateDto.itemId); -> actually code uses findByPawnTicketId cache
        
        const input = {
            pawnTicketId: ticketId,
            items: [
                {
                    itemId: itemId,
                    brand: 'New Brand',
                    itemDescription: 'New Desc'
                }
            ],
            clerkUserId: 'user-1'
        };

        await useCase.execute(input);

        expect(mockInventoryRepo.update).toHaveBeenCalledTimes(1);
        const updatedItem = mockInventoryRepo.update.mock.calls[0][0];
        expect(updatedItem.brand).toBe('New Brand');
        expect(updatedItem.itemDescription).toBe('New Desc');
        expect(updatedItem.model).toBe('Old Model'); // Untouched
        expect(updatedItem.lastUpdatedUserId).toBe('user-1');
    });

    it('should throw ForbiddenError if item does not belong to ticket', async () => {
        mockPawnTicketRepo.findById.mockResolvedValue({ id: ticketId } as PawnTicket);
        mockInventoryRepo.findByPawnTicketId.mockResolvedValue([mockItem]); // unrelated item is not here

        const input = {
            pawnTicketId: ticketId,
            items: [
                {
                    itemId: otherItemId, // Not in the ticket's items
                    brand: 'New Brand'
                }
            ]
        };

        await expect(useCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if pawn ticket validation fails', async () => {
        mockPawnTicketRepo.findById.mockResolvedValue(null);

        const input = {
            pawnTicketId: '99999999-9999-9999-9999-999999999999',
            items: [
                {
                    itemId: itemId
                }
            ]
        };

        await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });
});
