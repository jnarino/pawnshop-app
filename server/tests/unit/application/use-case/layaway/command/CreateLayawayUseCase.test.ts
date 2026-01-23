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
        
        mockInventoryItemRepo = {
            findById: jest.fn(),
            update: jest.fn(), 
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
            items: [
                {
                    description: 'Gold Ring',
                    price: 200,
                    quantity: 1,
                    inventoryItemId: 'inv-123'
                },
                {
                    description: 'Silver Watch',
                    price: 100,
                    quantity: 1,
                    inventoryItemId: 'inv-456'
                }
            ],
            tenders: [
                {
                    tenderTypeId: 1,
                    amount: 50
                }
            ],
            taxExemptUsed: false // Default
        };

        const mockCustomer = new Customer({
            id: customerId,
            firstName: 'John',
            lastName: 'Doe',
        } as any);

        const mockInventoryItem1 = {
            id: 'inv-123',
            inventoryNumber: '1001',
            status: 'I',
            quantity: 1,
            itemDescription: 'Gold Ring',
            cost: 100, // Dummy
            price: 200,
        };

        const mockInventoryItem2 = {
            id: 'inv-456',
            inventoryNumber: '1002',
            status: 'I',
            quantity: 1,
            itemDescription: 'Silver Watch',
            cost: 50,
            price: 100
        };

        mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
        mockControlNumberRepo.getNextStoreSaleControlNumber.mockResolvedValue('SALE-999');
        mockInventoryItemRepo.findById
            .mockResolvedValueOnce(mockInventoryItem1)
            .mockResolvedValueOnce(mockInventoryItem2);

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
        expect(updatedItem.quantity).toBe(0); // 1 - 1 = 0

        // Verify Store Transaction created
        expect(mockStoreTransactionRepo.create).toHaveBeenCalled();
        
        // Verify Layaway Created
        expect(mockLayawayRepo.create).toHaveBeenCalledTimes(2); // 2 items
        
        // Verify ticketnum usage in Layaway Agreement
        const layawayArg1 = mockLayawayRepo.create.mock.calls[0][0];
        const layawayArg2 = mockLayawayRepo.create.mock.calls[1][0];
        expect(layawayArg1.ticketnum).toBe('SALE-999');
        expect(layawayArg2.ticketnum).toBe('SALE-999');

        expect(layawayArg1.inventoryNumber).toBe('1001');
        expect(layawayArg2.inventoryNumber).toBe('1002');
    });

    it('should throw NotFoundError if customer does not exist', async () => {
        mockControlNumberRepo.getNextStoreSaleControlNumber.mockResolvedValue('SALE-999');
        mockCustomerRepo.findById.mockResolvedValue(null);

        const input: CreateLayawayRequestDto = {
            customerId: '00000000-0000-0000-0000-000000000001',
            items: [
                {
                    description: 'Item',
                    price: 10,
                    quantity: 1,
                    inventoryItemId: 'inv-999'
                }
            ],
            tenders: [],
            taxExemptUsed: false
        };

        await expect(useCase.execute(input, 'user-1')).rejects.toThrow(NotFoundError);
    });
});
