import { VoidLayawayPaymentUseCase } from '../../../../../../src/application/use-case/layaway/command/VoidLayawayPaymentUseCase';
import { LayawayUnitOfWork } from '../../../../../../src/application/common/LayawayUnitOfWork';
import { StoreTransactionTypeId } from '../../../../../../src/domains/storeTransaction/storeTransactionTypes';

describe('VoidLayawayPaymentUseCase', () => {
    let useCase: VoidLayawayPaymentUseCase;
    let mockUow: jest.Mocked<LayawayUnitOfWork>;
    let mockLayawayRepo: any;
    let mockStoreTxRepo: any;
    let mockInventoryRepo: any;
    let mockControlNumberRepo: any;

    const customerId = '00000000-0000-0000-0000-000000000001';
    const clerkId = 'clerk-123';
    const ticketnum = 'TICKET-1';

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
            update: jest.fn(),
        };
        mockControlNumberRepo = {
            getNextStoreSaleControlNumber: jest.fn().mockResolvedValue('VOID-101')
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

        useCase = new VoidLayawayPaymentUseCase(mockUow, mockControlNumberRepo);
    });

    const baseItem = {
        id: '1',
        ticketnum: ticketnum,
        customerId: customerId,
        status: 'Active',
        amount: 100, // Grand Total
        totalOfPayments: 50, // Paid so far
        itemsId: 'inv-1',
        numberSold: 1,
        itemAmount: 100,
        itemStatus: 'L'
    };

    it('should void a partial payment successfully', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([baseItem]);

        const input = {
            customerId: customerId,
            ticketnum: ticketnum,
            amount: 20
        };

        const result = await useCase.execute(input, clerkId);

        expect(result.message).toContain('Payment voided');
        expect(mockLayawayRepo.update).toHaveBeenCalled();
        const updatedItem = mockLayawayRepo.update.mock.calls[0][0];
        // 50 - 20 = 30
        expect(updatedItem.totalOfPayments).toBe(30);
        expect(updatedItem.status).toBe('Active'); // Stays active

        expect(mockStoreTxRepo.create).toHaveBeenCalled();
        const tx = mockStoreTxRepo.create.mock.calls[0][0];
        expect(tx.typeId).toBe(StoreTransactionTypeId.UNDO_LAYAWAY_PAYMENT);
        expect(tx.amount).toBe(20);
    });

    it('should revert Sold status if voiding final payment', async () => {
        const soldItem = { 
            ...baseItem, 
            status: 'Sold', 
            totalOfPayments: 100,
            itemStatus: 'S' 
        };
        mockLayawayRepo.findByTicketNum.mockResolvedValue([soldItem]);
        mockInventoryRepo.findById.mockResolvedValue({ id: 'inv-1', status: 'S' });

        const input = {
            customerId: customerId,
            ticketnum: ticketnum,
            amount: 20 // 100 - 20 = 80 (< 100, so revert to Active)
        };

        await useCase.execute(input, clerkId);

        const updatedItem = mockLayawayRepo.update.mock.calls[0][0];
        expect(updatedItem.totalOfPayments).toBe(80);
        expect(updatedItem.status).toBe('Active');
        expect(updatedItem.itemStatus).toBe('L');

        expect(mockInventoryRepo.update).toHaveBeenCalled();
        const updatedInv = mockInventoryRepo.update.mock.calls[0][0];
        expect(updatedInv.status).toBe('L');
    });

    it('should fail if trying to void more than total paid', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([baseItem]); // Paid 50

        const input = {
            customerId: customerId,
            ticketnum: ticketnum,
            amount: 60
        };

        await expect(useCase.execute(input, clerkId)).rejects.toThrow(/Cannot void/);
    });
});
