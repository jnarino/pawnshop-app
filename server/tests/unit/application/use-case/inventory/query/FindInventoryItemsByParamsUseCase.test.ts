import { InventoryItemRepository } from '../../../../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../../../../src/domains/inventory/InventoryItem';
import { FindInventoryItemsByParamsUseCase } from '../../../../../../src/application/use-case/inventory/query/FindInventoryItemsByParamsUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findAvailableByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
  setStatusByPawnTicket = jest.fn();
  updateStatus = jest.fn();
  findByInventoryNumbers = jest.fn();
  getNextInventoryNumber = jest.fn();
  updateStatusAndQuantity = jest.fn();
  getInventoryNumberById = jest.fn();
  findByPawnTicketId = jest.fn();
  findByParams = jest.fn();
}

describe('FindInventoryItemsByParamsUseCase', () => {
  it('should return mapped inventory items', async () => {
    const repo = new MockInventoryItemRepository();
    const useCase = new FindInventoryItemsByParamsUseCase(repo);

    const item = new InventoryItem({
      id: 'item-1',
      inventorySubcategoryId: 'sub-1',
      status: 'I',
      quantity: 1,
      brand: 'brand-1',
      model: 'Model X',
      serialNumber: 'SN123',
      colorId: 'Color1',
      itemCondition: 'New',
      ownerMark: 'Mark',
      itemDescription: 'Desc',
      priceAmount: 100,
      resale: 80,
      minResale: 70,
      itemReplace: 120,
      extra: {},
      attributes: {},
      legacyInventoryNumber: null,
      legacyItemGuid: null,
      legacyCategoryDescription: null,
      legacyBrandColorDescription: null,
      inventoryNumber: 'INV-1',
      lastUpdatedUserId: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z')
    });

    (item as any)._enrichedData = {
      inventorySubcategory: { id: 'sub-1', name: 'Sub' },
      inventoryCategory: { id: 'cat-1', name: 'Cat' },
      brand: { id: 'brand-1', name: 'Brand' }
    };

    repo.findByParams.mockResolvedValue([item]);

    const result = await useCase.execute({ brandId: 'brand-1' });

    expect(result).toHaveLength(1);
    expect(result[0].inventoryCategory.name).toBe('Cat');
    expect(repo.findByParams).toHaveBeenCalledWith({ brandId: 'brand-1' });
  });
});
