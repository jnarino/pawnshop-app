import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { NotFoundError } from '../../../src/application/common/errors';
import { UpdateInventoryItemUseCase } from '../../../src/application/use-case/inventory/command/UpdateInventoryItemUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  create = jest.fn();
  update = jest.fn(async (i: InventoryItem) => i);
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
}

describe('UpdateInventoryItemUseCase', () => {
  it('should throw NotFoundError if item does not exist', async () => {
    const repo = new MockInventoryItemRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new UpdateInventoryItemUseCase(repo);

    await expect(
      useCase.execute({
        id: '999',
        categoryId: 'cat-123'
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should update existing inventory item', async () => {
    const repo = new MockInventoryItemRepository();
    const existingItem = new InventoryItem({
      id: '123',
      categoryId: 'old-cat',
      status: 'I',
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingItem);

    const useCase = new UpdateInventoryItemUseCase(repo);

    const result = await useCase.execute({
      id: '123',
      categoryId: 'new-cat',
      brand: 'Updated Brand',
      model: 'New Model'
    });

    expect(repo.findById).toHaveBeenCalledWith('123');
    expect(repo.update).toHaveBeenCalled();
    expect(result.categoryId).toBe('new-cat');
  });

  it('should preserve fields not included in update', async () => {
    const repo = new MockInventoryItemRepository();
    const existingItem = new InventoryItem({
      id: '123',
      categoryId: 'cat-123',
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
      id: '123',
      brand: 'Updated Brand'
    });

    expect(repo.update).toHaveBeenCalled();
    const updatedItem = repo.update.mock.calls[0][0];
    expect(updatedItem.serialNumber).toBe('SN123');
    expect(updatedItem.quantity).toBe(5);
  });
});
