// tests/unit/pawnTicket/UpdatePawnTicketItemsUseCase.ComplexInput.test.ts
import { UpdatePawnTicketItemsUseCase } from '../../../src/application/use-case/pawnTicket/command/UpdatePawnTicketItemsUseCase';
import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';

describe('UpdatePawnTicketItemsUseCase - Complex Input', () => {
    let useCase: UpdatePawnTicketItemsUseCase;
    let mockInventoryRepo: jest.Mocked<InventoryItemRepository>;
    let mockPawnTicketRepo: jest.Mocked<PawnTicketRepository>;

    beforeEach(() => {
        mockInventoryRepo = {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findByInventoryNumber: jest.fn(),
            findBySerialNumber: jest.fn(),
            findByPawnTicketId: jest.fn(),
            findAvailableByInventoryNumber: jest.fn(),
            findByInventoryNumbers: jest.fn(),
            setStatusByPawnTicket: jest.fn(),
            updateStatusAndQuantity: jest.fn(),
            getInventoryNumberById: jest.fn(),
            getNextInventoryNumber: jest.fn(),
        } as any;

        mockPawnTicketRepo = {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        } as any;

        useCase = new UpdatePawnTicketItemsUseCase(mockInventoryRepo, mockPawnTicketRepo);
    });

    const ticketId = '00000000-0000-0000-0000-000000000000';
    const itemId = '11111111-1111-1111-1111-111111111111';

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

    it('should handle complex JSON input from frontend correctly', async () => {
        mockPawnTicketRepo.findById.mockResolvedValue({ id: ticketId } as PawnTicket);
        mockInventoryRepo.findByPawnTicketId.mockResolvedValue([mockItem]);
        
        const complexInput = {
            id: ticketId, // Should map to pawnTicketId
            controlNumber: "118101", // Should be ignored
            items: [
                {
                    id: itemId, // Should map to itemId
                    inventorySubcategory: {
                        id: "99999999-9999-9999-9999-999999999999", // Should be extracted
                        name: "RING"
                    },
                    brand: {
                        id: "88888888-8888-8888-8888-888888888888", // Should be extracted
                        name: "NONE"
                    },
                    itemDescription: "Updated Description from Complex JSON",
                    // The following fields should be ignored by the use case logic (immutable)
                    priceAmount: 200, 
                    quantity: 5
                }
            ],
            clerkUserId: 'user-complex'
        };

        await useCase.execute(complexInput);

        expect(mockInventoryRepo.update).toHaveBeenCalledTimes(1);
        const updatedItem = mockInventoryRepo.update.mock.calls[0][0];
        
        expect(updatedItem.itemDescription).toBe("Updated Description from Complex JSON");
        expect(updatedItem.inventorySubcategoryId).toBe("99999999-9999-9999-9999-999999999999");
        expect(updatedItem.brand).toBe("88888888-8888-8888-8888-888888888888");
        expect(updatedItem.priceAmount).toBe(100); // Should NOT change from old value
        expect(updatedItem.quantity).toBe(1);      // Should NOT change from old value
    });
});
