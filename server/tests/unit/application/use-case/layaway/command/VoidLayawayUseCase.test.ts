import { VoidLayawayUseCase } from '../../../../../../src/application/use-case/layaway/command/VoidLayawayUseCase';
import { LayawayUnitOfWork } from '../../../../../../src/application/common/LayawayUnitOfWork';
import { StoreTransactionTypeId } from '../../../../../../src/domains/storeTransaction/storeTransactionTypes';
import { NotFoundError } from '../../../../../../src/application/common/errors';

describe('VoidLayawayUseCase', () => {
    let useCase: VoidLayawayUseCase;
    let mockUow: jest.Mocked<LayawayUnitOfWork>;
    let mockLayawayRepo: any;
    let mockStoreTxRepo: any;
    let mockInventoryRepo: any;

    const clerkId = 'clerk-123';
    const ticketnum = 'LAYOUT-100';

    beforeEach(() => {
        mockLayawayRepo = {
            findByTicketNum: jest.fn(),
            update: jest.fn(),
        };
        mockStoreTxRepo = {
            create: jest.fn(),
        };
        mockInventoryRepo = {
            findById: jest.fn(),
            updateStatusAndQuantity: jest.fn(),
        };

        mockUow = {
            runInTransaction: jest.fn().mockImplementation(async (callback) => {
                return callback({
                    layawayRepository: mockLayawayRepo,
                    storeTransactionRepository: mockStoreTxRepo,
                    inventoryItemRepository: mockInventoryRepo,
                });
            }),
        } as any;

        useCase = new VoidLayawayUseCase(mockUow);
    });

    const layawayItems = [
        {
            id: 'la-1',
            ticketnum: ticketnum,
            customerId: 'cust-1',
            status: 'Active',
            amount: 200,
            itemsId: 'inv-1',
            inventoryNumber: 'INV-001',
            numberSold: 1,
            description: 'Guitar',
            itemStatus: 'L'
        },
         {
            id: 'la-2',
            ticketnum: ticketnum,
            customerId: 'cust-1',
            status: 'Active',
            amount: 200,
            itemsId: 'inv-2',
            inventoryNumber: 'INV-002',
            numberSold: 1,
            description: 'Amp',
            itemStatus: 'L'
        }
    ];

    it('should void layaway, return items to inventory, and create negative transaction', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue(layawayItems);
        mockInventoryRepo.findById.mockResolvedValue({ id: '56064fbb-428e-49cc-abeb-6571886b4f5f', status: 'L' });

        const input = {
            controlNumber: ticketnum,
            items: [
                { inventoryItemId: '56064fbb-428e-49cc-abeb-6571886b4f5f', description: 'Guitar', quantity: 1, price: 200 },
                { inventoryItemId: '56064fbb-428e-49cc-abeb-6571886b4f60', description: 'Amp', quantity: 1, price: 200 }
            ],
            tenders: [
                { tenderTypeId: 1, amount: 400 } // Cash
            ],
            note: 'Customer cancellation'
        };

        const result = await useCase.execute(input, clerkId);

        expect(result.message).toBe('Layaway voided successfully');
        
        // Check Layaway Status Update
        expect(mockLayawayRepo.update).toHaveBeenCalledTimes(2);
        // Both items should be updated to Voided
        expect(mockLayawayRepo.update.mock.calls[0][0].status).toBe('Voided');
        expect(mockLayawayRepo.update.mock.calls[0][0].itemStatus).toBe('V');
        expect(mockLayawayRepo.update.mock.calls[1][0].status).toBe('Voided');
        expect(mockLayawayRepo.update.mock.calls[1][0].itemStatus).toBe('V');

        // Check Inventory Return
        expect(mockInventoryRepo.updateStatusAndQuantity).toHaveBeenCalledTimes(2);
        expect(mockInventoryRepo.updateStatusAndQuantity).toHaveBeenCalledWith('inv-1', 'I', 1);
        expect(mockInventoryRepo.updateStatusAndQuantity).toHaveBeenCalledWith('inv-2', 'I', 1);

        // Check Transaction
        expect(mockStoreTxRepo.create).toHaveBeenCalled();
        const tx = mockStoreTxRepo.create.mock.calls[0][0];
        expect(tx.typeId).toBe(StoreTransactionTypeId.VOIDED_LAYAWAY);
        expect(tx.amount).toBe(-400); // Negative amount (total from tenders)
        expect(tx.controlNumber).toBe(ticketnum); // Should match control number
        expect(tx.customerId).toBe('cust-1');
        expect(tx.tenders[0].tenderTypeId).toBe(1);
        expect(tx.tenders[0].amount).toBe(-400); // Negative for refund
        expect(tx.note).toBe('Customer cancellation');
    });

    it('should throw NotFoundError if ticket not found', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([]);

        const input = {
            controlNumber: 'NON-EXISTENT',
            items: [
                { inventoryItemId: '56064fbb-428e-49cc-abeb-6571886b4f5f', description: 'Guitar', quantity: 1, price: 200 }
            ],
            tenders: [
                { tenderTypeId: 1, amount: 200 }
            ]
        };

        await expect(useCase.execute(input, clerkId))
            .rejects.toThrow(NotFoundError);
    });

    it('should throw error if already Voided', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([{ ...layawayItems[0], status: 'Voided' }]);

        const input = {
            controlNumber: ticketnum,
            items: [
                { inventoryItemId: '56064fbb-428e-49cc-abeb-6571886b4f5f', description: 'Guitar', quantity: 1, price: 200 }
            ],
            tenders: [
                { tenderTypeId: 1, amount: 200 }
            ]
        };

        await expect(useCase.execute(input, clerkId))
            .rejects.toThrow(/is already voided/);
    });

    it('should throw error if already Sold', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([{ ...layawayItems[0], status: 'Sold' }]);

        const input = {
            controlNumber: ticketnum,
            items: [
                { inventoryItemId: '56064fbb-428e-49cc-abeb-6571886b4f5f', description: 'Guitar', quantity: 1, price: 200 }
            ],
            tenders: [
                { tenderTypeId: 1, amount: 200 }
            ]
        };

        await expect(useCase.execute(input, clerkId))
            .rejects.toThrow(/is already sold/);
    });
});
