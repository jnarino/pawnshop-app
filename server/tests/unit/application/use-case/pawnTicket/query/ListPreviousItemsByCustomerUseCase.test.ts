import { ListPreviousItemsByCustomerUseCase } from '../../../../../../src/application/use-case/pawnTicket/query/ListPreviousItemsByCustomerUseCase';
import { PawnTicketRepository } from '../../../../../../src/domains/pawnTicket/PawnTicketRepository';
import { InventoryItem } from '../../../../../../src/domains/inventory/InventoryItem';

describe('ListPreviousItemsByCustomerUseCase', () => {
  let pawnTicketRepo: jest.Mocked<PawnTicketRepository>;
  let useCase: ListPreviousItemsByCustomerUseCase;

  beforeEach(() => {
    pawnTicketRepo = {
      listPreviousItemsByCustomer: jest.fn(),
    } as any;

    useCase = new ListPreviousItemsByCustomerUseCase(pawnTicketRepo);
  });

  it('returns distinct previous items when found', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    
    const mockItems = [
      new InventoryItem({
        id: 'item-1',
        inventorySubcategoryId: 'subcat-1',
        status: 'U',
        quantity: 1,
        itemDescription: '14KT GOLD BRACELET',
        priceAmount: 100,
        resale: 100,
        minResale: 0,
        itemReplace: 0,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-09'),
      }),
      new InventoryItem({
        id: 'item-2',
        inventorySubcategoryId: 'subcat-2',
        status: 'T',
        quantity: 1,
        itemDescription: 'DIAMOND RING',
        priceAmount: 500,
        resale: 500,
        minResale: 0,
        itemReplace: 0,
        createdAt: new Date('2025-12-15'),
        updatedAt: new Date('2026-01-08'),
      }),
    ];

    pawnTicketRepo.listPreviousItemsByCustomer.mockResolvedValue(mockItems);

    const result = await useCase.execute({ customerId });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('item-1');
    expect(result[0].itemDescription).toBe('14KT GOLD BRACELET');
    expect(result[1].id).toBe('item-2');
    expect(result[1].itemDescription).toBe('DIAMOND RING');
    expect(pawnTicketRepo.listPreviousItemsByCustomer).toHaveBeenCalledWith(customerId);
  });

  it('returns empty array when no items found', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    
    pawnTicketRepo.listPreviousItemsByCustomer.mockResolvedValue([]);

    const result = await useCase.execute({ customerId });

    expect(result).toHaveLength(0);
    expect(pawnTicketRepo.listPreviousItemsByCustomer).toHaveBeenCalledWith(customerId);
  });

  it('throws validation error for invalid UUID', async () => {
    const invalidCustomerId = 'not-a-uuid';

    await expect(useCase.execute({ customerId: invalidCustomerId })).rejects.toThrow();
  });

  it('throws validation error for missing customerId', async () => {
    await expect(useCase.execute({})).rejects.toThrow();
  });

  it('maps inventory items to response DTOs with enriched data', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    
    const mockItem = new InventoryItem({
      id: 'item-1',
      inventorySubcategoryId: 'subcat-1',
      status: 'U',
      quantity: 1,
      brand: 'brand-1',
      model: 'Model X',
      serialNumber: 'SN123456',
      colorId: 'color-1',
      itemCondition: 'Good',
      ownerMark: 'Initial JD',
      itemDescription: 'MENS WATCH',
      priceAmount: 150,
      resale: 150,
      minResale: 100,
      itemReplace: 0,
      extra: { weight: 141.9 },
      attributes: { metal: { id: 'metal-1', name: 'Stainless Steel' } },
      legacyInventoryNumber: '103864-1',
      legacyItemGuid: 'guid-123',
      legacyCategoryDescription: 'WATCH',
      legacyBrandColorDescription: 'ELGIN',
      inventoryNumber: '103864-1',
      lastUpdatedUserId: 'user-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-09'),
    });

    // Attach enriched data as repository does
    (mockItem as any)._enrichedData = {
      inventorySubcategory: { id: 'subcat-1', name: 'Watches' },
      inventoryCategory: { id: 'cat-1', name: 'Jewelry' },
      brand: { id: 'brand-1', name: 'Elgin' },
    };

    pawnTicketRepo.listPreviousItemsByCustomer.mockResolvedValue([mockItem]);

    const result = await useCase.execute({ customerId });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('item-1');
    expect(result[0].itemDescription).toBe('MENS WATCH');
    expect(result[0].priceAmount).toBe(150);
    expect(result[0].resale).toBe(150);
    expect(result[0].status).toBe('U');
    expect(result[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result[0].updatedAt).toBe('2026-01-09T00:00:00.000Z');
  });

  it('preserves extra and attributes in response', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    
    const mockItem = new InventoryItem({
      id: 'item-1',
      inventorySubcategoryId: 'subcat-1',
      status: 'V',
      quantity: 1,
      itemDescription: 'DIAMOND ENGAGEMENT RING',
      priceAmount: 2000,
      resale: 2000,
      minResale: 1500,
      itemReplace: 0,
      extra: {
        stones: [
          {
            type: { id: 'type-1', name: 'Diamond' },
            carat: 1.5,
            color: { id: 'color-1', name: 'D' },
            shape: { id: 'shape-1', name: 'Round' },
          },
        ],
        weight: 3.2,
      },
      attributes: {
        karat: { id: 'karat-1', name: '18K' },
        metal: { id: 'metal-1', name: 'White Gold' },
      },
      createdAt: new Date('2025-11-01'),
      updatedAt: new Date('2026-01-09'),
    });

    (mockItem as any)._enrichedData = {
      inventorySubcategory: { id: 'subcat-1', name: 'Rings' },
      inventoryCategory: { id: 'cat-1', name: 'Jewelry' },
      brand: null,
    };

    pawnTicketRepo.listPreviousItemsByCustomer.mockResolvedValue([mockItem]);

    const result = await useCase.execute({ customerId });

    expect(result[0].extra).toEqual({
      stones: [
        {
          type: { id: 'type-1', name: 'Diamond' },
          carat: 1.5,
          color: { id: 'color-1', name: 'D' },
          shape: { id: 'shape-1', name: 'Round' },
        },
      ],
      weight: 3.2,
    });
    expect(result[0].attributes).toEqual({
      karat: { id: 'karat-1', name: '18K' },
      metal: { id: 'metal-1', name: 'White Gold' },
    });
  });
});
