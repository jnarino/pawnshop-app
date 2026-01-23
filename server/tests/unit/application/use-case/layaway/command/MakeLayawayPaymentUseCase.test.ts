import { MakeLayawayPaymentUseCase } from '../../../../../../src/application/use-case/layaway/command/MakeLayawayPaymentUseCase';
import { LayawayUnitOfWork } from '../../../../../../src/application/common/LayawayUnitOfWork';
import { MakeLayawayPaymentRequestDto } from '../../../../../../src/application/dto/layaway/command/MakeLayawayPaymentRequestDto';
import { StoreTransactionTypeId } from '../../../../../../src/domains/storeTransaction/storeTransactionTypes';
import { NotFoundError } from '../../../../../../src/application/common/errors';

describe('MakeLayawayPaymentUseCase', () => {
  let useCase: MakeLayawayPaymentUseCase;
  let mockUow: jest.Mocked<LayawayUnitOfWork>;
  let mockLayawayRepo: any;
  let mockStoreTxRepo: any;
  let mockInventoryRepo: any;
  let mockControlNumberRepo: any;

  beforeEach(() => {
    mockLayawayRepo = {
      findByTicketNum: jest.fn(),
      update: jest.fn(),
    };
    mockStoreTxRepo = {
      create: jest.fn(),
    };
    mockInventoryRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockControlNumberRepo = {
       getNextStoreSaleControlNumber: jest.fn().mockResolvedValue('10001')
    };

    mockUow = {
      runInTransaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          layawayRepository: mockLayawayRepo,
          storeTransactionRepository: mockStoreTxRepo,
          inventoryItemRepository: mockInventoryRepo,
        });
      }),
    } as any;

    useCase = new MakeLayawayPaymentUseCase(mockUow, mockControlNumberRepo);
  });

  const customerId = '00000000-0000-0000-0000-000000000001';
  const mismatchId = '00000000-0000-0000-0000-000000000002';
  const clerkId = 'clerk-123';
  const ticketnum = 'TICKET-1';

  const baseItem = {
    id: '1',
    ticketnum: ticketnum,
    customerId: customerId, // Matching customer
    status: 'Active',
    amount: 100, // Grand Total
    totalOfPayments: 20, // Paid so far
    itemsId: 'inv-1',
    numberSold: 1,
    itemAmount: 100,
    itemStatus: 'L',
    taxSales: 6.50,
    stateTax: 6.50,
    defaultDate: new Date('2023-01-01')
  };

  it('should process partial payment and update defaultDate', async () => {
    mockLayawayRepo.findByTicketNum.mockResolvedValue([baseItem]);

    const input = {
      customerId: customerId,
      ticketnum: ticketnum,
      amount: 30, // 20 + 30 = 50 < 100
      tenderTypeId: 1,
    };

    const result = await useCase.execute(input, clerkId);

    expect(result.message).toContain('Payment processed successfully');
    expect(mockLayawayRepo.update).toHaveBeenCalled();
    const updatedItem = mockLayawayRepo.update.mock.calls[0][0];
    expect(updatedItem.totalOfPayments).toBe(50);
    expect(updatedItem.status).toBe('Active');

    // Check that defaultDate is updated to approx 30 days from now
    const now = new Date();
    const expectedDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const actualDate = updatedItem.defaultDate;
    
    // Allow small difference (e.g. 10s buffer) for execution time
    const diff = Math.abs(actualDate.getTime() - expectedDate.getTime());
    expect(diff).toBeLessThan(10000);

    expect(mockStoreTxRepo.create).toHaveBeenCalled();
    const tx = mockStoreTxRepo.create.mock.calls[0][0];
    expect(tx.typeId).toBe(StoreTransactionTypeId.LAYAWAY_PAYMENT);
    expect(tx.taxSales).toBe(0); // No tax on partial payment
  });

  it('should process full payment (pickup) successfully', async () => {
    mockLayawayRepo.findByTicketNum.mockResolvedValue([baseItem]);
    mockInventoryRepo.findById.mockResolvedValue({ id: 'inv-1', status: 'L' });

    const input = {
      customerId: customerId,
      ticketnum: ticketnum,
      amount: 80, // 20 + 80 = 100 (Paid Off)
      tenderTypeId: 1,
    };

    const result = await useCase.execute(input, clerkId);

    expect(result.message).toContain('paid in full');
    const updatedAgreement = mockLayawayRepo.update.mock.calls[0][0];
    expect(updatedAgreement.status).toBe('Sold');
    expect(updatedAgreement.itemStatus).toBe('S');
    expect(mockInventoryRepo.update).toHaveBeenCalled();
    expect(mockInventoryRepo.update.mock.calls[0][0].status).toBe('S');
    const tx = mockStoreTxRepo.create.mock.calls[0][0];
    expect(tx.typeId).toBe(StoreTransactionTypeId.LAYAWAY_PICKUP);
    expect(tx.taxSales).toBe(6.50); // Tax recorded on pickup
  });

  it('should throw error if customerId does not match', async () => {
    mockLayawayRepo.findByTicketNum.mockResolvedValue([baseItem]);

    const input = {
      customerId: mismatchId, // Mismatch
      ticketnum: ticketnum,
      amount: 30,
    };

    await expect(useCase.execute(input, clerkId)).rejects.toThrow(/does not belong to customer/);
  });

  it('should handle multi-item layaway by updating all items consistently', async () => {
    const item1 = { ...baseItem, id: '1', itemsId: 'inv-1', itemAmount: 60 };
    const item2 = { ...baseItem, id: '2', itemsId: 'inv-2', itemAmount: 40 };
    // Both share header info: amount=100, totalOfPayments=20

    mockLayawayRepo.findByTicketNum.mockResolvedValue([item1, item2]);
    mockInventoryRepo.findById.mockResolvedValue({ status: 'L' });

    const input = {
        customerId: customerId,
        ticketnum: ticketnum,
        amount: 80,
    };

    await useCase.execute(input, clerkId);

    expect(mockLayawayRepo.update).toHaveBeenCalledTimes(2);
    
    // Check item 1
    const update1 = mockLayawayRepo.update.mock.calls[0][0];
    expect(update1.id).toBe('1');
    expect(update1.totalOfPayments).toBe(100);
    expect(update1.status).toBe('Sold');

     // Check item 2
    const update2 = mockLayawayRepo.update.mock.calls[1][0];
    expect(update2.id).toBe('2');
    expect(update2.totalOfPayments).toBe(100);
    expect(update2.status).toBe('Sold');
  });
});
