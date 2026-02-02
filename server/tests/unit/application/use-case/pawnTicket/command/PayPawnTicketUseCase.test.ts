
import { PayPawnTicketUseCase } from '../../../../../../src/application/use-case/pawnTicket/command/PayPawnTicketUseCase';
import { PawnTicketRepository } from '../../../../../../src/domains/pawnTicket/PawnTicketRepository';
import { InventoryItemRepository } from '../../../../../../src/domains/inventory/InventoryItemRepository';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { GetPawnTicketCurrentChargesUseCase } from '../../../../../../src/application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { NotFoundError } from '../../../../../../src/application/common/errors';
import { GunLogRepository, GunTransactionHistoryRepository } from '../../../../../../src/domains/gun/GunRepository';
import { CustomerRepository } from '../../../../../../src/domains/customer/CustomerRepository';
import { AppUserRepository } from '../../../../../../src/domains/appUser/AppUserRepository';

describe('PayPawnTicketUseCase', () => {
  let pawnTicketRepository: jest.Mocked<PawnTicketRepository>;
  let inventoryItemRepository: jest.Mocked<InventoryItemRepository>;
  let storeTransactionRepository: jest.Mocked<StoreTransactionRepository>;
  let gunLogRepository: jest.Mocked<GunLogRepository>;
  let gunTransactionHistoryRepository: jest.Mocked<GunTransactionHistoryRepository>;
  let customerRepository: jest.Mocked<CustomerRepository>;
  let appUserRepository: jest.Mocked<AppUserRepository>;
  
  let getPawnTicketCurrentChargesUseCase: jest.Mocked<GetPawnTicketCurrentChargesUseCase>;
  let pawnTicketUnitOfWork: any;
  let useCase: PayPawnTicketUseCase;

  const PAWN_TICKET_ID = '11111111-1111-1111-1111-111111111111';
  const CLERK_USER_ID = '22222222-2222-2222-2222-222222222222';
  const CUSTOMER_ID = '33333333-3333-3333-3333-333333333333';
  const GUN_ITEM_ID = '44444444-4444-4444-4444-444444444444';
  const PAWN_TICKET_ID_2 = '55555555-5555-5555-5555-555555555555';
  const GUN_ITEM_ID_2 = '66666666-6666-6666-6666-666666666666';

  beforeEach(() => {
    pawnTicketRepository = {
      updatePaymentFields: jest.fn(),
      addPayment: jest.fn(),
      setStatus: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: PAWN_TICKET_ID,
        controlNumber: '123456',
        customerId: CUSTOMER_ID,
        amountFinanced: 100,
        maturityDate: new Date(),
        createdDate: new Date(),
        dueDate: new Date(),
      }),
      findByCriteria: jest.fn(),
      listByControlNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    
    inventoryItemRepository = {
      setStatusByPawnTicket: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByInventoryNumber: jest.fn(),
      findAvailableByInventoryNumber: jest.fn(),
      findBySerialNumber: jest.fn(),
      getNextInventoryNumber: jest.fn(),
      findByPawnTicketId: jest.fn().mockResolvedValue([
        { itemDescription: 'Test Item', model: 'Model X' }
      ]), 
    } as any;
    
    storeTransactionRepository = {
      createPayment: jest.fn(),
      create: jest.fn(),
    } as any;
    
    gunLogRepository = {
        findByInventoryItemId: jest.fn().mockResolvedValue(null),
        getNextGunTransferNumber: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
    } as any;
    
    gunTransactionHistoryRepository = {
        create: jest.fn(),
        getTransactionTypeIdByCode: jest.fn().mockResolvedValue('type-uuid'),
    } as any;
    
    customerRepository = {
        findById: jest.fn().mockResolvedValue({
            id: CUSTOMER_ID,
            firstName: 'John',
            lastName: 'Doe'
        }),
    } as any;
    
    appUserRepository = {
        findById: jest.fn().mockResolvedValue({ username: 'clerk' }),
    } as any;

    getPawnTicketCurrentChargesUseCase = {
      execute: jest.fn(),
    } as any;
    
    pawnTicketUnitOfWork = {
      runInTransaction: jest.fn(async (fn: any) => {
        return fn({
          inventoryItemRepository,
          pawnTicketRepository,
          storeTransactionRepository,
          gunLogRepository,
          gunTransactionHistoryRepository,
          customerRepository,
          dbClient: {} // mock client
        });
      })
    };
    useCase = new PayPawnTicketUseCase(
      pawnTicketUnitOfWork,
      getPawnTicketCurrentChargesUseCase,
      appUserRepository
    );
  });

  it('should execute payment successfully', async () => {
    // Arrange
    const input = {
        items: [{
            pawnTicketId: PAWN_TICKET_ID,
            controlNumber: '1001',
            createdDate: new Date().toISOString(),
            amountPaid: 100
        }],
        tenders: [{
            id: 't-1',
            name: 'Cash',
            amount: 100,
            tenderTypeId: 1
        }],
        clerkUserId: CLERK_USER_ID
    };

    getPawnTicketCurrentChargesUseCase.execute.mockResolvedValue({
        currentCharges: 10,
        redemptionAmount: 110,
        amountFinanced: 100,
        financeCharge: 10,
        // ...
    } as any);

    // Act
    await useCase.execute(input);

    // Assert
    expect(pawnTicketUnitOfWork.runInTransaction).toHaveBeenCalled();
    expect(pawnTicketRepository.updatePaymentFields).toHaveBeenCalledWith(expect.objectContaining({
        pawnTicketId: PAWN_TICKET_ID,
        paymentAmount: 100,
        setRedeemed: false // 100 paid < 110 check
    }));
    expect(storeTransactionRepository.createPayment).toHaveBeenCalled();
  });

  it('should handle redemption and gun log update', async () => {
    // Arrange
    const input = {
        items: [{
            pawnTicketId: PAWN_TICKET_ID,
            controlNumber: 'GUN-1001',
            createdDate: new Date().toISOString(),
            amountPaid: 200
        }],
        tenders: [{
            id: 't-1',
            name: 'Cash',
            amount: 200,
            tenderTypeId: 1
        }],
        clerkUserId: CLERK_USER_ID,
        nicstn: 'NICS-TEST',
        gunNotes1: 'Note 1'
    };

    getPawnTicketCurrentChargesUseCase.execute.mockResolvedValue({
        currentCharges: 20,
        redemptionAmount: 120,
    } as any);

    inventoryItemRepository.findByPawnTicketId.mockResolvedValue([
        { id: GUN_ITEM_ID, inventoryNumber: 'G-1' } as any
    ]);

    gunLogRepository.findByInventoryItemId.mockResolvedValue({
        id: 'gl-1',
        inventoryItemId: GUN_ITEM_ID,
        // ...
    } as any);
    
    gunLogRepository.getNextGunTransferNumber.mockResolvedValue('TRANS-TEST');

    pawnTicketRepository.listByControlNumber.mockResolvedValue([
        { id: PAWN_TICKET_ID, customerId: CUSTOMER_ID } as any
    ]);
    
    customerRepository.findById.mockResolvedValue({
        id: CUSTOMER_ID,
        firstName: 'John',
        lastName: 'Wick'
    } as any);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toBeDefined();
    if (result) {
        expect(result.gunTransferNumber).toBe('TRANS-TEST');
    }
    
    expect(gunLogRepository.update).toHaveBeenCalled();
    const updatedLog = gunLogRepository.update.mock.calls[0][0];
    expect(updatedLog.nicstn).toBe('NICS-TEST');
    expect(updatedLog.soldFirstName).toBe('John');
    
    expect(gunTransactionHistoryRepository.create).toHaveBeenCalled();
  });

  it('should handle multiple guns and fee correctly', async () => {
    // Arrange: 2 Tickets, both guns, plus fee
    const input = {
        items: [
            {
                pawnTicketId: PAWN_TICKET_ID,
                controlNumber: 'GUN-MULTI-1',
                createdDate: new Date().toISOString(),
                amountPaid: 100
            },
            {
                pawnTicketId: PAWN_TICKET_ID_2,
                controlNumber: 'GUN-MULTI-2',
                createdDate: new Date().toISOString(),
                amountPaid: 100
            }
        ],
        tenders: [{
            id: 't-1',
            name: 'Cash',
            amount: 205, // 200 for tickets, 5 for fee
            tenderTypeId: 1
        }],
        clerkUserId: CLERK_USER_ID,
        nicstn: 'NICS-MULTI',
        gunFee: 5.00
    };

    // Mocks
    getPawnTicketCurrentChargesUseCase.execute.mockResolvedValue({
        currentCharges: 10,
        redemptionAmount: 100, // Exact amount covered
    } as any);

    // Mock Inventory lookups
    inventoryItemRepository.findByPawnTicketId.mockImplementation(async (id) => {
        if (id === PAWN_TICKET_ID) return [{ id: GUN_ITEM_ID, inventoryNumber: 'G-1' } as any];
        if (id === PAWN_TICKET_ID_2) return [{ id: GUN_ITEM_ID_2, inventoryNumber: 'G-2' } as any];
        return [];
    });

    // Mock GunLog lookups
    const gun1 = { id: 'gl-1', inventoryItemId: GUN_ITEM_ID };
    const gun2 = { id: 'gl-2', inventoryItemId: GUN_ITEM_ID_2 };

    gunLogRepository.findByInventoryItemId.mockImplementation(async (id) => {
        if (id === GUN_ITEM_ID) return gun1 as any;
        if (id === GUN_ITEM_ID_2) return gun2 as any;
        return null;
    });

    gunLogRepository.getNextGunTransferNumber.mockResolvedValue('TRANS-MULTI-99');

    // Mock Ticket lookups (for customer)
    pawnTicketRepository.listByControlNumber.mockImplementation(async (cn) => {
        if (cn === 'GUN-MULTI-1') return [{ id: PAWN_TICKET_ID, customerId: CUSTOMER_ID } as any];
        if (cn === 'GUN-MULTI-2') return [{ id: PAWN_TICKET_ID_2, customerId: CUSTOMER_ID } as any];
        return [];
    });

    customerRepository.findById.mockResolvedValue({ id: CUSTOMER_ID, firstName: 'John' } as any);
    appUserRepository.findById.mockResolvedValue({ id: CLERK_USER_ID, username: 'admin' } as any);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result?.gunTransferNumber).toBe('TRANS-MULTI-99');
    expect(gunLogRepository.getNextGunTransferNumber).toHaveBeenCalledTimes(1); // Shared
    
    // Updates
    expect(gunLogRepository.update).toHaveBeenCalledTimes(2); // Both guns updated
    
    // Fee Tx
    expect(storeTransactionRepository.create).toHaveBeenCalledTimes(1);
    const feeTx = storeTransactionRepository.create.mock.calls[0][0];
    expect(feeTx.amount).toBe(5);
    expect(feeTx.note).toContain('GUN PROCESSING FEE');
  });

  it('should create fee transaction with correct note and tender when paid by Debit', async () => {
    // Arrange
    const input = {
        items: [{
            pawnTicketId: PAWN_TICKET_ID,
            controlNumber: 'GUN-FEE-TEST',
            createdDate: new Date().toISOString(),
            amountPaid: 100
        }],
        tenders: [{
            id: 't-debit',
            name: 'Debit Card',
            amount: 105, // 100 redemption + 5 fee
            tenderTypeId: 2 // Assume 2 is Debit/Non-Cash
        }],
        clerkUserId: CLERK_USER_ID,
        nicstn: 'NICS-FEE',
        gunFee: 5.00
    };

    getPawnTicketCurrentChargesUseCase.execute.mockResolvedValue({
        currentCharges: 10,
        redemptionAmount: 100,
    } as any);

    inventoryItemRepository.findByPawnTicketId.mockResolvedValue([
        { id: GUN_ITEM_ID, inventoryNumber: 'G-FEE' } as any
    ]);

    gunLogRepository.findByInventoryItemId.mockResolvedValue({
        id: 'gl-fee',
        inventoryItemId: GUN_ITEM_ID,
    } as any);
    
    gunLogRepository.getNextGunTransferNumber.mockResolvedValue('TRANS-FEE');

    pawnTicketRepository.listByControlNumber.mockResolvedValue([
        { id: PAWN_TICKET_ID, customerId: CUSTOMER_ID } as any
    ]);
    
    customerRepository.findById.mockResolvedValue({ id: CUSTOMER_ID, firstName: 'John' } as any);
    appUserRepository.findById.mockResolvedValue({ id: CLERK_USER_ID, username: 'admin' } as any);

    // Act
    await useCase.execute(input);

    // Assert Fee Transaction
    expect(storeTransactionRepository.create).toHaveBeenCalled();
    const feeTx = storeTransactionRepository.create.mock.calls[0][0]; // First Arg
    
    expect(feeTx.amount).toBe(5);
    expect(feeTx.typeId).toBe(24);
    expect(feeTx.note).toBe('GUN PROCESSING FEE BY ADMIN'); // Exact check
    
    // Check Tender
    expect(feeTx.tenders).toHaveLength(1);
    expect(feeTx.tenders[0].tenderTypeId).toBe(2); // Should match input Debit
    expect(feeTx.tenders[0].amount).toBe(5);
  });
});
