import { CreateLayawayUseCase } from '../../../../../../src/application/use-case/layaway/command/CreateLayawayUseCase';
import { LayawayUnitOfWork } from '../../../../../../src/application/common/LayawayUnitOfWork';
import { ControlNumberRepository } from '../../../../../../src/domains/controlNumber/ControlNumberRepository';
import { CustomerRepository } from '../../../../../../src/domains/customer/CustomerRepository';
import { CreateLayawayRequestDto } from '../../../../../../src/application/dto/layaway/command/CreateLayawayRequestDto';
import { NotFoundError } from '../../../../../../src/application/common/errors';
import { Customer } from '../../../../../../src/domains/customer/Customer';

describe('CreateLayawayUseCase', () => {
    let useCase: CreateLayawayUseCase;
    let mockUnitOfWork: jest.Mocked<LayawayUnitOfWork>;
    let mockControlNumberRepo: jest.Mocked<ControlNumberRepository>;
    let mockCustomerRepo: jest.Mocked<CustomerRepository>;

    // Mock Repositories inside UoW
    let mockLayawayRepo: any;
    let mockStoreTransactionRepo: any;
    let mockInventoryRepo: any;
    let mockInventoryItemRepo: any;

    const mockDate = new Date('2024-01-01T12:00:00Z');

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(mockDate);

        mockLayawayRepo = {
            create: jest.fn().mockImplementation((agreement) => Promise.resolve(agreement)),
        };
        mockStoreTransactionRepo = {
            create: jest.fn().mockImplementation((tx) => Promise.resolve(tx)),
            createLineItem: jest.fn(),
            createTender: jest.fn(),
        };
        mockInventoryRepo = {
            findById: jest.fn(),
            updateStatus: jest.fn(),
        };
        // In the usecase it uses inventoryItemRepository for findById/update
        // The interface name in UoW might be inventoryItemRepository? Let's assume so based on reading UseCase code
        mockInventoryItemRepo = {
            findById: jest.fn(),
            update: jest.fn(), // Changed from updateStatus to update
        };

        mockUnitOfWork = {
            runInTransaction: jest.fn().mockImplementation(async (callback) => {
                return callback({
                    layawayRepository: mockLayawayRepo,
                    storeTransactionRepository: mockStoreTransactionRepo,
                    inventoryItemRepository: mockInventoryItemRepo,
                });
            }),
        } as any;

        mockControlNumberRepo = {
            getNextStoreSaleControlNumber: jest.fn(),
            getNextPawnControlNumber: jest.fn(),
            getNextPurchaseControlNumber: jest.fn(),
        };

        mockCustomerRepo = {
            findById: jest.fn(),
        } as any;

        useCase = new CreateLayawayUseCase(
            mockUnitOfWork,
            mockControlNumberRepo,
            mockCustomerRepo
        );
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create a layaway successfully using store_sale_control_number_next', async () => {
        // Arrange
        const customerId = '00000000-0000-0000-0000-000000000000';
        const input: CreateLayawayRequestDto = {
            customerId,
            downPayment: 50,
            period: 30, // Add explicit period
            items: [
                {
                    description: 'Gold Ring',
                    amount: 200,
                    quantity: 1,
                    inventoryItemId: 'inv-123' // Inventory item
                },
                {
                    description: 'Manual Service',
                    amount: 100,
                    quantity: 1
                    // No ID -> X-ITEM
                }
            ]
        };

        const mockCustomer = new Customer({
            id: customerId,
            firstName: 'John',
            lastName: 'Doe',
        } as any);

        const mockInventoryItem = {
            id: 'inv-123',
            inventoryNumber: '1001',
            status: 'I',
            quantity: 1,
        };

        mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
        mockControlNumberRepo.getNextStoreSaleControlNumber.mockResolvedValue('SALE-999');
        mockInventoryItemRepo.findById.mockResolvedValue(mockInventoryItem);

        // Act
        const result = await useCase.execute(input, 'user-123');

        // Assert
        expect(mockControlNumberRepo.getNextStoreSaleControlNumber).toHaveBeenCalled();
        
        // Verify Customer check
        expect(mockCustomerRepo.findById).toHaveBeenCalledWith(customerId);

        // Verify UoW execution
        expect(mockUnitOfWork.runInTransaction).toHaveBeenCalled();

        // Verify Inventory lookup for item 1
        expect(mockInventoryItemRepo.findById).toHaveBeenCalledWith('inv-123');

        // Verify Inventory status update for item 1
        expect(mockInventoryItemRepo.update).toHaveBeenCalled();
        const updatedItem = mockInventoryItemRepo.update.mock.calls[0][0];
        expect(updatedItem.status).toBe('L');
        expect(updatedItem.quantity).toBe(0);

        // Verify Store Transaction created
        expect(mockStoreTransactionRepo.create).toHaveBeenCalled();
        const createdTx = mockStoreTransactionRepo.create.mock.calls[0][0];
        expect(createdTx.typeId).toBe(12); // SL - LAYAWAY_DEPOSIT (need to verify this ID from enum/DB but usually mapped)
        
        // Verify Layaway Created
        expect(mockLayawayRepo.create).toHaveBeenCalledTimes(2); // 2 items
        
        // Verify ticketnum usage in Layaway Agreement
        const layawayArg1 = mockLayawayRepo.create.mock.calls[0][0];
        const layawayArg2 = mockLayawayRepo.create.mock.calls[1][0];
        expect(layawayArg1.ticketnum).toBe('SALE-999');
        expect(layawayArg2.ticketnum).toBe('SALE-999');

        // Verify X-ITEM handling
        // First item was inventory, so inventoryNumber should be '1001'
        expect(layawayArg1.inventoryNumber).toBe('1001');
        // Second item was manual, so inventoryNumber should be 'X-ITEM' or '0' (based on implementation)
        // Implementation: itemDto.inventoryItemId ? (lookup) : 'X-ITEM' or similar. 
        // Use case code: 
        // let inventoryNumber = '0'; 
        // if (!itemDto.inventoryItemId) { inventoryNumber = 'X-ITEM'; }
        expect(layawayArg2.inventoryNumber).toBe('X-ITEM');
    });

    it('should throw NotFoundError if customer does not exist', async () => {
        mockControlNumberRepo.getNextStoreSaleControlNumber.mockResolvedValue('SALE-999');
        mockCustomerRepo.findById.mockResolvedValue(null);

        const input: CreateLayawayRequestDto = {
            customerId: '00000000-0000-0000-0000-000000000001',
            items: [
                {
                    description: 'Item',
                    amount: 10,
                    quantity: 1
                }
            ],
            downPayment: 0,
            period: 30
        };

        await expect(useCase.execute(input, 'user-1')).rejects.toThrow(NotFoundError);
    });
});
