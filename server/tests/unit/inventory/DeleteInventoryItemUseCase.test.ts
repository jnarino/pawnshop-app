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
  findBySerialNumber = jest.fn();
}

describe('DeleteInventoryItemUseCase', () => {
  it('should throw NotFoundError if item does not exist', async () => {
    const repo = new MockInventoryItemRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new DeleteInventoryItemUseCase(repo);

    await expect(
      useCase.execute('999')
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should delete existing inventory item', async () => {
    const repo = new MockInventoryItemRepository();
    const existingItem = new InventoryItem({
      id: '123',
      categoryId: 'cat-123',
      status: 'I',
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingItem);

    const useCase = new DeleteInventoryItemUseCase(repo);

    await useCase.execute('123');

    expect(repo.findById).toHaveBeenCalledWith('123');
    expect(repo.delete).toHaveBeenCalledWith('123');
  });
});
