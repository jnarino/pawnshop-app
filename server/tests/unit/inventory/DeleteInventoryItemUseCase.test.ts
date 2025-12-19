import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { NotFoundError } from '../../../src/application/common/errors';
import { DeleteInventoryItemUseCase } from '../../../src/application/use-case/inventory/command/DeleteInventoryItemUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findAvailableByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
}

describe('DeleteInventoryItemUseCase', () => {
  const itemId = '550e8400-e29b-41d4-a716-446655440002';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';
  const subcategoryId = '550e8400-e29b-41d4-a716-446655440000';

  it('should throw NotFoundError if item does not exist', async () => {
    const repo = new MockInventoryItemRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new DeleteInventoryItemUseCase(repo);

    await expect(
      useCase.execute({ id: nonExistentId })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should delete existing inventory item', async () => {
    const repo = new MockInventoryItemRepository();
    const existingItem = new InventoryItem({
      id: itemId,
      inventorySubcategoryId: subcategoryId,
      status: 'I',
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingItem);

    const useCase = new DeleteInventoryItemUseCase(repo);

    await useCase.execute({ id: itemId });

    expect(repo.findById).toHaveBeenCalledWith(itemId);
    expect(repo.delete).toHaveBeenCalledWith(itemId);
  });
});
