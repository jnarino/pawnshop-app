
import { CreateStoreTransactionUseCase } from '../../../../../../src/application/use-case/storeTransaction/command/CreateStoreTransactionUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { InventoryItemRepository } from '../../../../../../src/domains/inventory/InventoryItemRepository';
import { CustomerRepository } from '../../../../../../src/domains/customer/CustomerRepository';
import { GunLogRepository, GunTransactionHistoryRepository } from '../../../../../../src/domains/gun/GunRepository';
import { AppUserRepository } from '../../../../../../src/domains/appUser/AppUserRepository';
import { CreateStoreTransactionDto } from '../../../../../../src/application/dto/storeTransaction/CreateStoreTransactionDto';
import { GunLog } from '../../../../../../src/domains/gun/GunLog';
import { InventoryItem } from '../../../../../../src/domains/inventory/InventoryItem';
import { Customer } from '../../../../../../src/domains/customer/Customer';
import { StoreTransaction } from '../../../../../../src/domains/storeTransaction/StoreTransaction';

describe('CreateStoreTransactionUseCase - Multiple Guns', () => {
    let useCase: CreateStoreTransactionUseCase;
    let mockStoreTransactionRepo: jest.Mocked<StoreTransactionRepository>;
    let mockInventoryRepo: jest.Mocked<InventoryItemRepository>;
    let mockCustomerRepo: jest.Mocked<CustomerRepository>;
    let mockGunLogRepo: jest.Mocked<GunLogRepository>;
    let mockGunHistoryRepo: jest.Mocked<GunTransactionHistoryRepository>;
    let mockAppUserRepo: jest.Mocked<AppUserRepository>;

    beforeEach(() => {
        mockStoreTransactionRepo = {
            create: jest.fn(),
            findByCriteria: jest.fn(),
        } as any;

        mockInventoryRepo = {
            findById: jest.fn(),
            update: jest.fn(),
        } as any;

        mockCustomerRepo = {
            findById: jest.fn(),
            findCustomer: jest.fn(),
        } as any;

        mockGunLogRepo = {
            findByInventoryItemId: jest.fn(),
            getNextGunTransferNumber: jest.fn(),
            update: jest.fn(),
        } as any;

        mockGunHistoryRepo = {
            create: jest.fn(),
            getTransactionTypeIdByCode: jest.fn().mockResolvedValue('sale-type-id'), 
        } as any;

        mockAppUserRepo = {
            findById: jest.fn(),
        } as any;

        useCase = new CreateStoreTransactionUseCase(
            mockStoreTransactionRepo,
            mockInventoryRepo,
            mockCustomerRepo,
            mockGunLogRepo,
            mockGunHistoryRepo,
            mockAppUserRepo
        );
    });

    it('should assign same gunTransferNumber and nicstn to multiple guns in one transaction', async () => {
        // Arrange
        const customer = new Customer({
            id: 'cust-1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Miami',
            stateUs: 'FL',
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any);
        mockCustomerRepo.findById.mockResolvedValue(customer);

        // Two items, both guns
        const item1Id = 'item-1';
        const item2Id = 'item-2';

        mockInventoryRepo.findById.mockImplementation(async (id: string) => {
            return new InventoryItem({
                id: id,
                inventoryNumber: `INV-${id}`,
                quantity: 1,
            } as any);
        });

        const gun1 = new GunLog({ id: 'gun-1', inventoryItemId: item1Id } as any);
        const gun2 = new GunLog({ id: 'gun-2', inventoryItemId: item2Id } as any);

        mockGunLogRepo.findByInventoryItemId.mockImplementation(async (id: string) => {
            if (id === item1Id) return gun1;
            if (id === item2Id) return gun2;
            return null;
        });

        // Sequence generator should be called ONLY ONCE ideally, or result reused
        mockGunLogRepo.getNextGunTransferNumber.mockResolvedValue('TRANS-999');

        mockStoreTransactionRepo.create.mockResolvedValue(new StoreTransaction({ id: 'tx-123' } as any));

        const input: CreateStoreTransactionDto = {
            customerId: 'cust-1',
            items: [
                { inventoryItemId: item1Id, quantity: 1, price: 500, description: 'Gun 1', inventoryNumber: 'INV-1' },
                { inventoryItemId: item2Id, quantity: 1, price: 600, description: 'Gun 2', inventoryNumber: 'INV-2' }
            ],
            tenders: [{ tenderTypeId: 1, amount: 1200 }],
            nicstn: 'NICS-BATCH-1',
            gunNotes1: 'Note 1',
            gunNotes2: 'Note 2'
        };

        // Act
        const result = await useCase.execute(input, 'clerk-1');

        // Assert
        expect(result.gunTransferNumber).toBe('TRANS-999');
        
        // Ensure generator called only once
        expect(mockGunLogRepo.getNextGunTransferNumber).toHaveBeenCalledTimes(1);

        // Verify updates
        expect(mockGunLogRepo.update).toHaveBeenCalledTimes(2);

        // Gun 1 checks
        const updateCall1 = mockGunLogRepo.update.mock.calls.find((call: any[]) => call[0].id === 'gun-1');
        const updatedGun1 = updateCall1![0];
        expect(updatedGun1.transactionNum).toBe('TRANS-999');
        expect(updatedGun1.origTransNum).toBe('TRANS-999');
        expect(updatedGun1.nicstn).toBe('NICS-BATCH-1');
        expect(updatedGun1.notes1).toBe('Note 1');

        // Gun 2 checks
        // Cast call to any[] to avoid strict type checks in test
        const updateCall2 = mockGunLogRepo.update.mock.calls.find((call: any[]) => call[0].id === 'gun-2');
        const updatedGun2 = updateCall2![0];
        expect(updatedGun2.transactionNum).toBe('TRANS-999');
        expect(updatedGun2.origTransNum).toBe('TRANS-999'); 
        expect(updatedGun2.nicstn).toBe('NICS-BATCH-1');
        expect(updatedGun2.notes1).toBe('Note 1');
    });
});
