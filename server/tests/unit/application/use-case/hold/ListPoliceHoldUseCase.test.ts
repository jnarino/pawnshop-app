import { ListPoliceHoldUseCase } from '../../../../../src/application/use-case/hold/query/ListPoliceHoldUseCase';
import { HoldRepository } from '../../../../../src/domains/hold/HoldRepository';
import { HoldItem } from '../../../../../src/domains/hold/HoldItem';


describe('ListPoliceHoldUseCase', () => {
    let useCase: ListPoliceHoldUseCase;
    let mockRepo: jest.Mocked<HoldRepository>;

    beforeEach(() => {
        mockRepo = {
            findList: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn()
        } as unknown as jest.Mocked<HoldRepository>;

        useCase = new ListPoliceHoldUseCase(mockRepo);
    });

    it('should return mapped holds when criteria is valid', async () => {
        const criteria = {
            controlNumber: '1000'
        };

        const mockDate = new Date('2023-01-01T00:00:00.000Z');
        const mockHold = new HoldItem({
            id: 'hold-1',
            controlNumber: '1000',
            holdDate: mockDate,
            agency: 'Police',
            caseNumber: 'CASE-123',
            dateOut: null,
            isHold: true,
            isInventory: false,
            comment: 'Stolen',
            agentLastName: 'Smith',
            agentFirstName: 'Agent',
            agentMiddleInitial: 'A',
            badgeNumber: '1234',
            phoneAreaCode: '555',
            phoneNumber: '123-4567',
            phoneExtension: '101',
            jurisdiction: 'City',
            legacyHcnId: null,
            clerkUsername: 'clerk1',
            updatedBy: null,
            createdAt: mockDate,
            updatedAt: mockDate,
            items: [
                {
                    id: 'inv-1',
                    inventorySubcategory: { id: 'sub-1', name: 'Sub' },
                    inventoryCategory: { id: 'cat-1', name: 'Cat' },
                    status: 'In Stock',
                    quantity: 1,
                    brand: { id: 'br-1', name: 'Sony' },
                    model: 'Model X',
                    serialNumber: 'SN123',
                    colorId: 'black',
                    itemCondition: 'Good',
                    ownerMark: 'None',
                    itemDescription: 'Item description',
                    priceAmount: 100,
                    inventoryNumber: 'INV-100'
                }
            ]
        });

        mockRepo.findList.mockResolvedValue([mockHold]);

        const result = await useCase.execute(criteria);

        expect(mockRepo.findList).toHaveBeenCalledWith(expect.objectContaining(criteria));
        expect(result).toHaveLength(1);
        expect(result[0].controlNumber).toBe('1000');
        expect(result[0].holdDate).toBe(mockDate.toISOString());
        expect(result[0].items).toHaveLength(1);
        expect(result[0].items[0].id).toBe('inv-1');
        expect(result[0].items[0].model).toBe('Model X');
        // @ts-ignore
        expect(result[0].items[0].inventorySubcategory.name).toBe('Sub');
    });

    it('should throw error if input is invalid', async () => {
        const invalidInput = { controlNumber: 123 }; // number instead of string
        await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });
});
