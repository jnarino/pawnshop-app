import { VoidStoreTransactionUseCase } from '../../../../../../src/application/use-case/storeTransaction/command/VoidStoreTransactionUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { InventoryItemRepository } from '../../../../../../src/domains/inventory/InventoryItemRepository';
import { CustomerRepository } from '../../../../../../src/domains/customer/CustomerRepository';
import { NotFoundError } from '../../../../../../src/application/common/errors';
import { StoreTransaction } from '../../../../../../src/domains/storeTransaction/StoreTransaction';
import { Customer } from '../../../../../../src/domains/customer/Customer';

describe('VoidStoreTransactionUseCase', () => {
    let useCase: VoidStoreTransactionUseCase;
    let mockStoreTransactionRepo: jest.Mocked<StoreTransactionRepository>;
    let mockInventoryRepo: jest.Mocked<InventoryItemRepository>;
    let mockCustomerRepo: jest.Mocked<CustomerRepository>;

    const originalTx = new StoreTransaction({
        id: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        typeId: 10,
        occurredAt: new Date(),
        amount: 50.00,
        createdAt: new Date(),
        updatedAt: new Date(),
        controlNumber: '110914'
    });

    const mockCustomer = new Customer({
        id: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    });

    const mockCashCustomer = new Customer({
        id: '123e4567-e89b-12d3-a456-426614174002',
        firstName: '',
        lastName: 'CASH CUSTOMER',
        dateOfBirth: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    });

    beforeEach(() => {
        mockStoreTransactionRepo = {
            create: jest.fn(),
            listByControlNumber: jest.fn(),
            createPayment: jest.fn(),
            getLastClose: jest.fn(),
            getActivitySinceClose: jest.fn(),
        } as any;

        mockInventoryRepo = {
            findById: jest.fn(),
            updateStatusAndQuantity: jest.fn(),
        } as any;

        mockCustomerRepo = {
            findCustomer: jest.fn(),
        } as any;

        useCase = new VoidStoreTransactionUseCase(
            mockStoreTransactionRepo,
            mockInventoryRepo,
            mockCustomerRepo
        );
    });

    it('should successfully void a transaction', async () => {
        // Arrange
        mockStoreTransactionRepo.listByControlNumber.mockResolvedValue([originalTx]);
        mockStoreTransactionRepo.create.mockResolvedValue({
            ...originalTx,
            id: 'new-void-tx',
            typeId: 11,
            amount: -50.00,
            items: [],
            tenders: []
        } as any);
        mockInventoryRepo.findById.mockResolvedValue({
            id: '123e4567-e89b-12d3-a456-426614174003',
            itemDescription: 'Test Item',
        } as any);

        const input = {
            controlNumber: '110914',
            items: [{ inventoryItemId: '123e4567-e89b-12d3-a456-426614174003', price: 50.00 }],
            tenders: [{ tenderTypeId: 1, amount: 50.00 }]
        };

        // Act
        const result = await useCase.execute(input, 'clerk-123');

        // Assert
        expect(mockStoreTransactionRepo.listByControlNumber).toHaveBeenCalledWith('110914');
        expect(mockStoreTransactionRepo.create).toHaveBeenCalled();
        expect(mockInventoryRepo.updateStatusAndQuantity).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174003', 'I', 1);
        
        // Check that create was called with correct negated amounts
        const createdTxArg = mockStoreTransactionRepo.create.mock.calls[0][0];
        expect(createdTxArg.amount).toBe(-50.00);
        expect(createdTxArg.tenders[0].amount).toBe(-50.00);
        expect(createdTxArg.items[0].lineAmount).toBe(-50.00);
        expect(createdTxArg.customerId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should fall back to CASH CUSTOMER if original tx has no customer', async () => {
        // Arrange
        const txNoCustomer = new StoreTransaction({ ...originalTx, customerId: null });
        mockStoreTransactionRepo.listByControlNumber.mockResolvedValue([txNoCustomer]);
        mockCustomerRepo.findCustomer.mockResolvedValue([mockCashCustomer]);
        mockInventoryRepo.findById.mockResolvedValue({} as any);
        mockStoreTransactionRepo.create.mockImplementation(async (tx) => tx);

        const input = {
            controlNumber: '110914',
            items: [{ inventoryItemId: '123e4567-e89b-12d3-a456-426614174003', price: 50.00 }],
            tenders: [{ tenderTypeId: 1, amount: 50.00 }]
        };

        // Act
        const result = await useCase.execute(input, 'clerk-123');

        // Assert
        expect(mockCustomerRepo.findCustomer).toHaveBeenCalledWith({ lastName: 'CASH CUSTOMER' });
        expect(mockStoreTransactionRepo.create).toHaveBeenCalled();
        const createdTxArg = mockStoreTransactionRepo.create.mock.calls[0][0];
        expect(createdTxArg.customerId).toBe('123e4567-e89b-12d3-a456-426614174002');
    });

    it('should throw NotFoundError if original control number not found', async () => {
        // Arrange
        mockStoreTransactionRepo.listByControlNumber.mockResolvedValue([]);

        const input = {
            controlNumber: 'INVALID',
            items: [],
            tenders: []
        };

        // Act & Assert
        await expect(useCase.execute(input, 'clerk-123'))
            .rejects.toThrow(NotFoundError);
    });
});
