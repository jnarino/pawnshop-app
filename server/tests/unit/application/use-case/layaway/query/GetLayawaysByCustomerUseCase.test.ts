import { GetLayawaysByCustomerUseCase } from '../../../../../../src/application/use-case/layaway/query/GetLayawaysByCustomerUseCase';
import { LayawayRepository } from '../../../../../../src/domains/layaway/LayawayRepository';
import { LayawayAgreement } from '../../../../../../src/domains/layaway/LayawayAgreement';

describe('GetLayawaysByCustomerUseCase', () => {
    let useCase: GetLayawaysByCustomerUseCase;
    let mockRepo: jest.Mocked<LayawayRepository>;

    beforeEach(() => {
        mockRepo = {
            findByCriteria: jest.fn(),
            create: jest.fn(),
        };
        useCase = new GetLayawaysByCustomerUseCase(mockRepo);
    });

    it('should list layaways for a specific customer', async () => {
        const customerId = '00000000-0000-0000-0000-000000000001';
        const dateIn = new Date('2023-01-01');

        const row = {
            id: '123',
            ticketnum: 'L1',
            clerkUserId: 'user1',
            dateIn,
            amount: 100,
            customerId: customerId,
            status: 'Active',
            createdAt: dateIn,
            updatedAt: dateIn,
            inventoryNumber: 'INV-1',
            items: []
        } as unknown as LayawayAgreement;

        mockRepo.findByCriteria.mockResolvedValue([row]);

        const result = await useCase.execute({ customerId });

        expect(mockRepo.findByCriteria).toHaveBeenCalledWith({
            customerId: customerId,
            status: undefined
        });

        expect(result).toHaveLength(1);
        expect(result[0].customerId).toBe(customerId);
    });
    
    it('should respect status filter', async () => {
         const customerId = '00000000-0000-0000-0000-000000000001';
         mockRepo.findByCriteria.mockResolvedValue([]); // Return empty array
         await useCase.execute({ customerId, status: 'Active' });
         
         expect(mockRepo.findByCriteria).toHaveBeenCalledWith({
            customerId: customerId,
            status: 'Active'
        });
    });
});
