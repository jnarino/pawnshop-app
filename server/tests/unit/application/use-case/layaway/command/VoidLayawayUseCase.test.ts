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

        const input = {
            ticketnum: ticketnum,
            amountToReturn: 50,
            tenderTypeId: 1, // Cash
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
        expect(tx.amount).toBe(-50); // Negative amount
        expect(tx.controlNumber).toBe(ticketnum); // Should match ticket num
        expect(tx.customerId).toBe('cust-1');
        expect(tx.tenders[0].tenderTypeId).toBe(1);
        expect(tx.tenders[0].amount).toBe(-50);
        expect(tx.note).toBe('Customer cancellation');
    });

    it('should throw NotFoundError if ticket not found', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([]);

        const input = {
            ticketnum: 'NON-EXISTENT',
            amountToReturn: 0,
            tenderTypeId: 1
        };

        await expect(useCase.execute(input, clerkId))
            .rejects.toThrow(NotFoundError);
    });

    it('should throw error if already Voided', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([{ ...layawayItems[0], status: 'Voided' }]);

        const input = {
            ticketnum: ticketnum,
            amountToReturn: 0,
            tenderTypeId: 1
        };

        await expect(useCase.execute(input, clerkId))
            .rejects.toThrow(/is already voided/);
    });

    it('should throw error if already Sold', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([{ ...layawayItems[0], status: 'Sold' }]);

        const input = {
            ticketnum: ticketnum,
            amountToReturn: 0,
            tenderTypeId: 1
        };

        await expect(useCase.execute(input, clerkId))
            .rejects.toThrow(/is already sold/);
    });
});
