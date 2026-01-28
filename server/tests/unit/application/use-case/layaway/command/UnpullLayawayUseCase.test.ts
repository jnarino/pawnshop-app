import { UnpullLayawayUseCase } from '../../../../../../src/application/use-case/layaway/command/UnpullLayawayUseCase';
import { LayawayUnitOfWork } from '../../../../../../src/application/common/LayawayUnitOfWork';
import { NotFoundError } from '../../../../../../src/application/common/errors';

describe('UnpullLayawayUseCase', () => {
    let useCase: UnpullLayawayUseCase;
    let mockUow: jest.Mocked<LayawayUnitOfWork>;
    let mockLayawayRepo: any;
    let mockInventoryRepo: any;

    const clerkId = 'clerk-123';
    const ticketnum = 'TICKET-UNPULL';

    beforeEach(() => {
        mockLayawayRepo = {
            findByTicketNum: jest.fn(),
            update: jest.fn(),
        };
        mockInventoryRepo = {
            findById: jest.fn(),
            updateStatusAndQuantity: jest.fn(),
        };

        mockUow = {
            runInTransaction: jest.fn().mockImplementation(async (callback) => {
                return callback({
                    layawayRepository: mockLayawayRepo,
                    inventoryItemRepository: mockInventoryRepo,
                });
            }),
        } as any;

        useCase = new UnpullLayawayUseCase(mockUow);
    });

    const defaultedItem = {
        id: 'la-1',
        ticketnum: ticketnum,
        status: 'Defaulted',
        itemsId: 'inv-1',
    };

    it('should unpull layaway if inventory is available', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([defaultedItem]);
        mockInventoryRepo.findById.mockResolvedValue({ id: 'inv-1', status: 'I' });

        const result = await useCase.execute({ ticketnum }, clerkId);

        expect(result.message).toBe('Layaway unpulled successfully');
        
        expect(mockLayawayRepo.update).toHaveBeenCalled();
        expect(mockLayawayRepo.update.mock.calls[0][0].status).toBe('Active');
        
        expect(mockInventoryRepo.updateStatusAndQuantity).toHaveBeenCalledWith('inv-1', 'L', 0);
    });

    it('should throw error if inventory item is not available (e.g. Sold)', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([defaultedItem]);
        mockInventoryRepo.findById.mockResolvedValue({ id: 'inv-1', status: 'S' });

        await expect(useCase.execute({ ticketnum }, clerkId))
            .rejects.toThrow(/not available/);
    });

    it('should throw error if layaway is not defaulted', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([{ ...defaultedItem, status: 'Active' }]);

        await expect(useCase.execute({ ticketnum }, clerkId))
            .rejects.toThrow(/has no defaulted items/);
    });
});
