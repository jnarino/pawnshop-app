import { GetLayawayByTicketNumUseCase } from '../../../../../../src/application/use-case/layaway/query/GetLayawayByTicketNumUseCase';
import { NotFoundError } from '../../../../../../src/application/common/errors';

describe('GetLayawayByTicketNumUseCase', () => {
    let useCase: GetLayawayByTicketNumUseCase;
    let mockLayawayRepo: any;

    beforeEach(() => {
        mockLayawayRepo = {
            findByTicketNum: jest.fn(),
        };
        useCase = new GetLayawayByTicketNumUseCase(mockLayawayRepo);
    });

    const baseHeader = {
        id: '1',
        ticketnum: '101',
        clerkUserId: 'clerk1',
        dateIn: new Date('2023-01-01'),
        lastUpdatedAt: new Date('2023-01-02'),
        amount: 100,
        taxSales: 5,
        stateTax: 5,
        returnedAmt: 0,
        customerId: 'cust1',
        customerFirstName: 'John',
        customerLastName: 'Doe',
        customerDateOfBirth: new Date('1980-01-01'),
        note: 'test note',
        status: 'Active',
        defaultDate: new Date('2023-02-01'),
        totalOfPayments: 20,
        period: 30,
        extraNote: '',
        gunProcFee: 0,
        lastUpdatedUserId: 'clerk1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
    };

    const baseItem = {
        inventoryNumber: 'INV-001',
        numberSold: 1,
        itemAmount: 100,
        description: 'Item Desc',
        taxExempt: false,
        returnSold: false,
        itemStatus: 'L',
        countyTaxExempt: false,
        itemLastUpdatedUserId: 'clerk1',
        itemsId: 'uuid-1',
    };

    it('should return layaway details with items when found', async () => {
        // Mock repo returning 2 items for same ticket
        const row1 = { ...baseHeader, ...baseItem, id: '1', itemsId: 'uuid-1', description: 'Item 1' };
        const row2 = { ...baseHeader, ...baseItem, id: '2', itemsId: 'uuid-2', description: 'Item 2' };
        
        mockLayawayRepo.findByTicketNum.mockResolvedValue([row1, row2]);

        const result = await useCase.execute({ ticketnum: '101' });

        expect(result.ticketnum).toBe('101');
        expect(result.items).toHaveLength(2);
        expect(result.items[0].description).toBe('Item 1');
        expect(result.items[1].description).toBe('Item 2');
        expect(mockLayawayRepo.findByTicketNum).toHaveBeenCalledWith('101');
    });

    it('should throw NotFoundError if repo returns empty array', async () => {
        mockLayawayRepo.findByTicketNum.mockResolvedValue([]);

        await expect(useCase.execute({ ticketnum: '999' }))
            .rejects.toThrow(NotFoundError);
    });
});
