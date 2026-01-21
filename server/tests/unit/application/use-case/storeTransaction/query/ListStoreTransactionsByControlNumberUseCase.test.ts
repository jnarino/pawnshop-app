import { ListStoreTransactionsByControlNumberUseCase } from '../../../../../../src/application/use-case/storeTransaction/query/ListStoreTransactionsByControlNumberUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { InventoryItemRepository } from '../../../../../../src/domains/inventory/InventoryItemRepository';
import { StoreTransaction } from '../../../../../../src/domains/storeTransaction/StoreTransaction';

describe('ListStoreTransactionsByControlNumberUseCase', () => {
    let storeTransactionRepo: jest.Mocked<StoreTransactionRepository>;
    let inventoryItemRepo: jest.Mocked<InventoryItemRepository>;
    let useCase: ListStoreTransactionsByControlNumberUseCase;

    beforeEach(() => {
        storeTransactionRepo = {
            listByControlNumber: jest.fn(),
        } as any;
        inventoryItemRepo = {
            getInventoryNumberById: jest.fn().mockResolvedValue('12345'),
        } as any;

        useCase = new ListStoreTransactionsByControlNumberUseCase(storeTransactionRepo, inventoryItemRepo);
    });


    it('returns a list of store transactions when found', async () => {
        const mockTransactions = [
            new StoreTransaction({
                id: 'tx-1',
                customerId: 'cust-1',
                controlNumber: '12345',
                typeId: 1,
                occurredAt: new Date('2023-01-01T10:00:00Z'),
                amount: 100,
                tenders: [],
                items: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
            new StoreTransaction({
                id: 'tx-2',
                customerId: 'cust-1',
                controlNumber: '12345',
                typeId: 2,
                occurredAt: new Date('2023-01-02T10:00:00Z'),
                amount: 120,
                tenders: [],
                items: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        ];

        storeTransactionRepo.listByControlNumber.mockResolvedValue(mockTransactions);

        const result = await useCase.execute('12345');

        expect(storeTransactionRepo.listByControlNumber).toHaveBeenCalledWith('12345');
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('tx-1');
        expect(result[1].id).toBe('tx-2');
    });

    it('returns an empty list when no transactions are found', async () => {
        storeTransactionRepo.listByControlNumber.mockResolvedValue([]);

        const result = await useCase.execute('99999');

        expect(storeTransactionRepo.listByControlNumber).toHaveBeenCalledWith('99999');
        expect(result).toHaveLength(0);
    });

    it('throws validation error if control number is missing', async () => {
        await expect(useCase.execute('')).rejects.toThrow();
    });
});
