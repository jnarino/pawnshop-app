import { GetDefaultedLayawaysUseCase } from '../../../../../../src/application/use-case/layaway/query/GetDefaultedLayawaysUseCase';
import { LayawayRepository } from '../../../../../../src/domains/layaway/LayawayRepository';
import { LayawayAgreement } from '../../../../../../src/domains/layaway/LayawayAgreement';

describe('GetDefaultedLayawaysUseCase', () => {
  let useCase: GetDefaultedLayawaysUseCase;
  let mockRepo: jest.Mocked<LayawayRepository>;

  beforeEach(() => {
    mockRepo = {
      findByCriteria: jest.fn(),
      create: jest.fn(),
      findByTicketNum: jest.fn(),
      update: jest.fn(),
      getHistory: jest.fn(),
      findDefaulted: jest.fn(),
    } as unknown as jest.Mocked<LayawayRepository>;
    
    useCase = new GetDefaultedLayawaysUseCase(mockRepo);
  });

  it('should return grouped defaulted layaways', async () => {
    const today = new Date();
    const defaultDate = new Date();
    defaultDate.setDate(today.getDate() - 2); // 2 days ago

    const ticketnum = '12345';
    const customerId = 'cust-1';

    // Simulate two items for the same layaway ticket
    const row1 = new LayawayAgreement({
      id: 'l-1',
      ticketnum,
      customerId,
      customerFirstName: 'John',
      customerLastName: 'Doe',
      defaultDate,
      note: null, // mandatory prop
      status: 'Active',
      amount: 100,
      inventoryNumber: 'INV-001',
      description: 'Item 1',
      itemAmount: 50,
      // ... fill other required fields with nulls or defaults
      clerkUserId: 'clerk-1',
      dateIn: new Date(),
      lastUpdatedAt: new Date(),
      taxSales: 0,
      stateTax: 0,
      returnedAmt: 0,
      totalOfPayments: 0,
      period: 30,
      extraNote: null,
      gunProcFee: 0,
      lastUpdatedUserId: null,
      numberSold: 1,
      taxExempt: false,
      returnSold: false,
      itemStatus: 'Active',
      countyTaxExempt: false,
      itemLastUpdatedUserId: null,
      itemsId: 'item-1',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const row2 = new LayawayAgreement({
      ...row1,
      inventoryNumber: 'INV-002',
      description: 'Item 2',
      itemAmount: 50,
      itemsId: 'item-2'
    });

    mockRepo.findDefaulted.mockResolvedValue([row1, row2]);

    const result = await useCase.execute();

    expect(mockRepo.findDefaulted).toHaveBeenCalled();
    // Should group into 1 layaway result
    expect(result).toHaveLength(1);
    
    const layaway = result[0];
    expect(layaway.controlNumber).toBe(ticketnum);
    expect(layaway.items).toHaveLength(2);
    expect(layaway.items[0].description).toBe('Item 1');
    expect(layaway.items[1].description).toBe('Item 2');
    expect(layaway.customer.firstName).toBe('John');
  });

  it('should return empty array if no defaulted layaways found', async () => {
    mockRepo.findDefaulted.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(mockRepo.findDefaulted).toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });
});
