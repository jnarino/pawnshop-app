import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { NotFoundError } from '../../../src/application/common/errors';
import { UpdateInventoryItemUseCase } from '../../../src/application/use-case/inventory/command/UpdateInventoryItemUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  setStatusByPawnTicket = jest.fn();
  create = jest.fn();
  update = jest.fn(async (i: InventoryItem) => i);
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findAvailableByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
  findByInventoryNumbers = jest.fn();
  updateStatusAndQuantity = jest.fn().mockResolvedValue(undefined);
  getNextInventoryNumber = jest.fn();
}

describe('UpdateInventoryItemUseCase', () => {
  const itemId = '550e8400-e29b-41d4-a716-446655440003';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';
  const oldSubcategoryId = '550e8400-e29b-41d4-a716-446655440010';
  const newSubcategoryId = '550e8400-e29b-41d4-a716-446655440011';
  const subcategoryId = '550e8400-e29b-41d4-a716-446655440000';

  it('should throw NotFoundError if item does not exist', async () => {
    const repo = new MockInventoryItemRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new UpdateInventoryItemUseCase(repo);

    await expect(
      useCase.execute({
        id: nonExistentId,
        inventorySubcategoryId: subcategoryId
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should update existing inventory item', async () => {
    const repo = new MockInventoryItemRepository();
    const existingItem = new InventoryItem({
      id: itemId,
      inventorySubcategoryId: oldSubcategoryId,
      status: 'I',
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingItem);

    const useCase = new UpdateInventoryItemUseCase(repo);

    const result = await useCase.execute({
      id: itemId,
      inventorySubcategoryId: newSubcategoryId,
      brand: 'Updated Brand',
      model: 'New Model'
    });

    expect(repo.findById).toHaveBeenCalledWith(itemId);
    expect(repo.update).toHaveBeenCalled();
    expect(result.inventorySubcategory.id).toBe(newSubcategoryId);
  });

  it('should preserve fields not included in update', async () => {
    const repo = new MockInventoryItemRepository();
    const existingItem = new InventoryItem({
      id: itemId,
      inventorySubcategoryId: subcategoryId,
      status: 'I',
      quantity: 5,
      brand: 'Original Brand',
      serialNumber: 'SN123',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingItem);

    const useCase = new UpdateInventoryItemUseCase(repo);

    await useCase.execute({
      id: itemId,
      brand: 'Updated Brand'
    });

    expect(repo.update).toHaveBeenCalled();
    const updatedItem = repo.update.mock.calls[0][0];
    expect(updatedItem.serialNumber).toBe('SN123');
    expect(updatedItem.quantity).toBe(5);
  });
});
