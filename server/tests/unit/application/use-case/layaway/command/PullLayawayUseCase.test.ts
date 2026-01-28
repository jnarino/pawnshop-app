import { PullLayawayUseCase } from '../../../../../../src/application/use-case/layaway/command/PullLayawayUseCase';
import { LayawayUnitOfWork } from '../../../../../../src/application/common/LayawayUnitOfWork';
import { NotFoundError } from '../../../../../../src/application/common/errors';

describe('PullLayawayUseCase', () => {
    let useCase: PullLayawayUseCase;
    let mockUow: jest.Mocked<LayawayUnitOfWork>;
    let mockLayawayRepo: any;
    let mockInventoryRepo: any;

    const clerkId = 'clerk-123';
    const ticketnum = 'TICKET-PULL';
    const customerId = '00000000-0000-0000-0000-000000000001';

    beforeEach(() => {
        mockLayawayRepo = {
            findByTicketNum: jest.fn(),
            update: jest.fn(),
        };
        mockInventoryRepo = {
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

        useCase = new PullLayawayUseCase(mockUow);
    });

    const activeItem = {
        id: 'la-1',
        ticketnum: ticketnum,
        status: 'Active',
        itemsId: 'inv-1',
        customerId: customerId
    };

    it('should pull active layaway', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([activeItem]);

        const result = await useCase.execute({ ticketnum, customerId }, clerkId);

        expect(result.message).toBe('Layaway pulled successfully');
        
        expect(mockLayawayRepo.update).toHaveBeenCalled();
        expect(mockLayawayRepo.update.mock.calls[0][0].status).toBe('Defaulted');
        
        expect(mockInventoryRepo.updateStatusAndQuantity).toHaveBeenCalledWith('inv-1', 'I', 1);
    });

    it('should throw error if already defaulted', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([{ ...activeItem, status: 'Defaulted' }]);

        await expect(useCase.execute({ ticketnum, customerId }, clerkId))
            .rejects.toThrow(/already defaulted/);
    });

    it('should throw NotFoundError if ticket exists but belongs to different customer', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([activeItem]);

        const otherCustomerId = '00000000-0000-0000-0000-000000000002';
        await expect(useCase.execute({ ticketnum, customerId: otherCustomerId }, clerkId))
            .rejects.toThrow(/does not belong to customer/);
    });
});
