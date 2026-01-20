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
            findCustomer: jest.fn(),
            // ... other methods if needed
        } as any;

        useCase = new CreateStoreTransactionUseCase(mockTxRepo, mockInvRepo, mockCustomerRepo);
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
});
