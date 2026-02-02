import { CreateStoreTransactionUseCase } from '../../../../../../src/application/use-case/storeTransaction/command/CreateStoreTransactionUseCase';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { InventoryItemRepository } from '../../../../../../src/domains/inventory/InventoryItemRepository';
import { CustomerRepository } from '../../../../../../src/domains/customer/CustomerRepository';
import { CreateStoreTransactionDto } from '../../../../../../src/application/dto/storeTransaction/CreateStoreTransactionDto';
import { Customer } from '../../../../../../src/domains/customer/Customer';

describe('CreateStoreTransactionUseCase', () => {
    let useCase: CreateStoreTransactionUseCase;
    let mockTxRepo: jest.Mocked<StoreTransactionRepository>;
    let mockInvRepo: jest.Mocked<InventoryItemRepository>;
    let mockCustomerRepo: jest.Mocked<CustomerRepository>;
    let mockGunLogRepo: any;
    let mockGunTxHistRepo: any;
    let mockAppUserRepo: any;

    beforeEach(() => {
        mockTxRepo = {
            create: jest.fn(),
            findByDateRange: jest.fn(),
            findByControlNumber: jest.fn(),
            findByCustomerId: jest.fn(),
            removeCashFromMainDrawer: jest.fn(),
            addMoneyToMainDrawer: jest.fn(),
            getBalanceCashDrawer: jest.fn(),
            closeBalanceCashDrawer: jest.fn(),
        } as any;

        mockInvRepo = {
            findById: jest.fn(),
            // ... other methods if needed
        } as any;

        mockCustomerRepo = {
            findById: jest.fn(),
            findCustomer: jest.fn(),
            // ... other methods if needed
        } as any;

        mockGunLogRepo = {
            findByInventoryItemId: jest.fn(),
            update: jest.fn(),
            getNextGunTransferNumber: jest.fn().mockResolvedValue('1000') // Add this
        };

        mockGunTxHistRepo = {
            create: jest.fn(),
            getTransactionTypeIdByCode: jest.fn().mockResolvedValue('sale-type-id')
        };

        mockAppUserRepo = {
            findById: jest.fn().mockResolvedValue({ id: 'clerk-id', username: 'testuser' })
        };

        useCase = new CreateStoreTransactionUseCase(mockTxRepo, mockInvRepo, mockCustomerRepo, mockGunLogRepo, mockGunTxHistRepo, mockAppUserRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should use provided customerId if present', async () => {
        const input: CreateStoreTransactionDto = {
            customerId: 'provided-id',
            items: [],
            tenders: [],
            taxExemptUsed: false,
            note: 'test'
        };

        mockTxRepo.create.mockImplementation(async (tx) => tx);

        const result = await useCase.execute(input, 'clerk-1');

        expect(result.customerId).toBe('provided-id');
        expect(mockCustomerRepo.findCustomer).not.toHaveBeenCalled();
    });

    it('should lookup CASH CUSTOMER if customerId is missing', async () => {
        const input: CreateStoreTransactionDto = {
            customerId: null,
            items: [],
            tenders: [],
            taxExemptUsed: false,
            note: 'test'
        }; // customerId null

        mockTxRepo.create.mockImplementation(async (tx) => tx);
        
        const mockCashCustomer = { id: 'cash-customer-id' } as Customer;
        mockCustomerRepo.findCustomer.mockResolvedValue([mockCashCustomer]);

        const result = await useCase.execute(input, 'clerk-1');

        expect(result.customerId).toBe('cash-customer-id');
        expect(mockCustomerRepo.findCustomer).toHaveBeenCalledWith({ lastName: 'CASH CUSTOMER' });
    });

    it('should use null if CASH CUSTOMER not found', async () => {
         const input: CreateStoreTransactionDto = {
            customerId: null,
            items: [],
            tenders: [],
            taxExemptUsed: false,
            note: 'test'
        }; 

        mockTxRepo.create.mockImplementation(async (tx) => tx);
        mockCustomerRepo.findCustomer.mockResolvedValue([]); // Not found

        const result = await useCase.execute(input, 'clerk-1');

        expect(result.customerId).toBeNull();
    });

    it('should handle custom items (no inventoryItemId) correctly', async () => {
        const input: CreateStoreTransactionDto = {
            customerId: 'cust-123',
            items: [{
                inventoryItemId: undefined, // Custom item
                inventoryNumber: '',
                description: 'Custom Service',
                quantity: 1,
                price: 100.00,
                taxExempt: false
            }],
            tenders: [{ tenderTypeId: 1, amount: 106.50 }], // 100 + 6.50 tax
            taxExemptUsed: false,
            note: 'custom item test'
        };

        mockTxRepo.create.mockImplementation(async (tx, invUpdates) => {
            // Check invUpdates is empty since no inventory item
            expect(invUpdates).toHaveLength(0);
            return tx;
        });

        const result = await useCase.execute(input, 'clerk-1');

        expect(mockInvRepo.findById).not.toHaveBeenCalled();
        expect(result.items).toHaveLength(1);
        expect(result.items[0].inventoryItemId).toBeNull();
        expect(result.items[0].description).toBe('Custom Service');
        expect(result.amount).toBe(106.50); // 100 + 6.5% tax
    });

    it('should split gun fee into separate transaction', async () => {
        const input: CreateStoreTransactionDto = {
            customerId: 'cust-123',
            gunFee: 25.00,
            items: [{
                inventoryItemId: undefined,
                inventoryNumber: '',
                description: 'Gun Item',
                quantity: 1,
                price: 100.00,
                taxExempt: false
            }],
            tenders: [{ tenderTypeId: 1, amount: 131.50 }], // 100 + 6.50 tax + 25 fee = 131.50
            taxExemptUsed: false,
            note: 'Gun Sale'
        };

        mockCustomerRepo.findById.mockResolvedValue({
            id: 'cust-123',
            firstName: 'John',
            lastName: 'Doe'
        } as any);

        mockTxRepo.create.mockImplementation(async (tx) => tx);

        await useCase.execute(input, 'clerk-1');

        // Verify two transactions were created
        expect(mockTxRepo.create).toHaveBeenCalledTimes(2);

        // First Call: Sale
        const saleTx = (mockTxRepo.create as jest.Mock).mock.calls[0][0];
        expect(saleTx.typeId).toBe(10);
        expect(saleTx.amount).toBe(106.50); // 100 + 6.50 tax
        expect(saleTx.tenders[0].amount).toBe(106.50); 
        
        // Second Call: Fee
        const feeTx = (mockTxRepo.create as jest.Mock).mock.calls[1][0];
        expect(feeTx.typeId).toBe(24);
        expect(feeTx.amount).toBe(25.00);
        expect(feeTx.tenders[0].amount).toBe(25.00); 
        expect(feeTx.note).toContain('GUN PROCESSING FEE-P BY testuser');
        expect(feeTx.items).toHaveLength(0);
    });

    it('should generate and return gunTransferNumber and save notes when gun is sold', async () => {
        const input: CreateStoreTransactionDto = {
            customerId: 'cust-123',
            items: [{
                inventoryItemId: 'inv-gun-1',
                inventoryNumber: 'G123',
                description: 'Gun',
                quantity: 1,
                price: 500.00
            }],
            tenders: [],
            taxExemptUsed: false,
            gunNotes1: 'Sold to police officer',
            gunNotes2: 'Badge #123'
        };

        const mockCustomer = { id: 'cust-123', firstName: 'John', lastName: 'Doe' };
        mockCustomerRepo.findById.mockResolvedValue(mockCustomer as any);
        
        const mockInvItem = { id: 'inv-gun-1', inventoryNumber: 'G123', priceAmount: 300 };
        mockInvRepo.findById.mockResolvedValue(mockInvItem as any);

        const mockGunLog = { id: 'gun-log-1', inventoryItemId: 'inv-gun-1', transactionNum: null };
        mockGunLogRepo.findByInventoryItemId.mockResolvedValue(mockGunLog);
        mockGunLogRepo.getNextGunTransferNumber.mockResolvedValue('GT-100');

        mockTxRepo.create.mockImplementation(async (tx) => tx);

        const result = await useCase.execute(input, 'clerk-1');

        expect(mockGunLogRepo.getNextGunTransferNumber).toHaveBeenCalled();
        expect(mockGunLogRepo.update).toHaveBeenCalledWith(expect.objectContaining({
            id: 'gun-log-1',
            transactionNum: 'GT-100',
            origTransNum: 'GT-100',
            notes1: 'Sold to police officer',
            notes2: 'Badge #123'
        }));
        
        expect(result).toHaveProperty('gunTransferNumber', 'GT-100');
    });
});


