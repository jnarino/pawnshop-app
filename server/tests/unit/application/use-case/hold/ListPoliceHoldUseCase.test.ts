import { ListPoliceHoldUseCase } from '../../../../../src/application/use-case/hold/query/ListPoliceHoldUseCase';
import { HoldRepository } from '../../../../../src/domains/hold/HoldRepository';
import { HoldItem } from '../../../../../src/domains/hold/HoldItem';


describe('ListPoliceHoldUseCase', () => {
    let useCase: ListPoliceHoldUseCase;
    let mockRepo: jest.Mocked<HoldRepository>;

    beforeEach(() => {
        mockRepo = {
            findList: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
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
            customerId: 'cust-1',
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
            updatedBy: null,
            createdAt: mockDate,
            updatedAt: mockDate,
            inventoryItemId: 'inv-1',
            model: 'Model X',
            itemDescription: 'Item description',
            serialNumber: 'SN123',
            inventoryNumber: 'INV-100',
            customerFirstName: 'John',
            customerLastName: 'Doe'
        });

        mockRepo.findList.mockResolvedValue([mockHold]);

        const result = await useCase.execute(criteria);

        expect(mockRepo.findList).toHaveBeenCalledWith(expect.objectContaining(criteria));
        expect(result).toHaveLength(1);
        expect(result[0].controlNumber).toBe('1000');
        expect(result[0].customerName).toBe('John Doe');
        expect(result[0].holdDate).toBe(mockDate.toISOString());
        expect(result[0].items).toHaveLength(1);
        expect(result[0].items[0].inventoryItemId).toBe('inv-1');
        expect(result[0].items[0].model).toBe('Model X');
    });

    it('should group multiple items under one hold', async () => {
        const criteria = { controlNumber: '1000' };
        const mockDate = new Date();
        
        const baseHold = {
            id: 'hold-1',
            controlNumber: '1000',
            customerId: 'cust-1',
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
            updatedBy: null,
            createdAt: mockDate,
            updatedAt: mockDate,
            customerFirstName: 'John',
            customerLastName: 'Doe'
        };

        const item1 = new HoldItem({ ...baseHold, inventoryItemId: 'inv-1', model: 'Item 1' });
        const item2 = new HoldItem({ ...baseHold, inventoryItemId: 'inv-2', model: 'Item 2' });

        mockRepo.findList.mockResolvedValue([item1, item2]);

        const result = await useCase.execute(criteria);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hold-1');
        expect(result[0].items).toHaveLength(2);
        expect(result[0].items[0].inventoryItemId).toBe('inv-1');
        expect(result[0].items[1].inventoryItemId).toBe('inv-2');
    });

    it('should throw error if input is invalid', async () => {
        const invalidInput = { controlNumber: 123 }; // number instead of string
        await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });
});
