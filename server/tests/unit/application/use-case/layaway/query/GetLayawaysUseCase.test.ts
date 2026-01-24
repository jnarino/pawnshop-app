import { GetLayawaysUseCase } from '../../../../../../src/application/use-case/layaway/query/GetLayawaysUseCase';
import { LayawayRepository } from '../../../../../../src/domains/layaway/LayawayRepository';
import { LayawayAgreement } from '../../../../../../src/domains/layaway/LayawayAgreement';

describe('GetLayawaysUseCase', () => {
  let useCase: GetLayawaysUseCase;
  let mockRepo: jest.Mocked<LayawayRepository>;

  beforeEach(() => {
    mockRepo = {
      findByCriteria: jest.fn(),
      create: jest.fn(),
      findByTicketNum: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<LayawayRepository>;
    useCase = new GetLayawaysUseCase(mockRepo);
  });

  it('should group items by ticketnum', async () => {
    // Two rows with same ticket number 'L100'
    const dateIn = new Date('2023-01-01');
    const lastUpdatedAt = new Date('2023-01-02');
    const createdAt = new Date('2023-01-01');
    const updatedAt = new Date('2023-01-02');
    const defaultDate = new Date('2023-02-01');

    const row1 = {
      id: '123-A',
      ticketnum: 'L100',
      clerkUserId: 'user1',
      dateIn,
      lastUpdatedAt,
      amount: 100,
      taxSales: 10,
      stateTax: 5,
      returnedAmt: 0,
      customerId: 'cust1',
      customerFirstName: 'John', 
      customerLastName: 'Doe',
      customerDateOfBirth: new Date('1990-01-01'),
      note: 'note',
      status: 'Active',
      defaultDate,
      totalOfPayments: 20,
      period: 30,
      extraNote: null,
      gunProcFee: 0,
      lastUpdatedUserId: 'user1',
      inventoryNumber: 'INV-1',
      numberSold: 1,
      itemAmount: 50,
      description: 'Item 1',
      taxExempt: false,
      returnSold: false,
      itemStatus: 'Active',
      countyTaxExempt: false,
      itemLastUpdatedUserId: 'user1',
      itemsId: 'item1',
      createdAt,
      updatedAt
    } as unknown as LayawayAgreement;

    const row2 = {
      ...row1,
      id: '123-B', // Different row ID (pk)
      inventoryNumber: 'INV-2',
      itemsId: 'item2',
      description: 'Item 2'
    } as unknown as LayawayAgreement;

    mockRepo.findByCriteria.mockResolvedValue([row1, row2]);

    const result = await useCase.execute({ status: 'Active' });

    // Should result in ONE layaway group
    expect(result).toHaveLength(1);
    
    // Check header
    expect(result[0].ticketnum).toBe('L100');
    expect(result[0].customer.firstName).toBe('John');
    expect(result[0].customer.lastName).toBe('Doe');
    expect(result[0].customer.dateOfBirth).toBe(new Date('1990-01-01').toISOString());
    expect(result[0].amount).toBe(100);

    // Check items
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items[0].inventoryNumber).toBe('INV-1');
    expect(result[0].items[1].inventoryNumber).toBe('INV-2');
  });

  it('should return empty list when no layaways found', async () => {
    mockRepo.findByCriteria.mockResolvedValue([]);
    const result = await useCase.execute({});
    expect(result).toHaveLength(0);
  });
});
