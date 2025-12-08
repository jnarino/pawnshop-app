import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { NotFoundError } from '../../../src/application/common/errors';
import { GetInventoryItemByInventoryNumberUseCase } from '../../../src/application/use-case/inventory/query/GetInventoryItemByInventoryNumberUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
}

describe('GetInventoryItemByInventoryNumberUseCase', () => {
  it('should throw NotFoundError if item does not exist', async () => {
    const repo = new MockInventoryItemRepository();
    repo.findByInventoryNumber.mockResolvedValue(null);
    const useCase = new GetInventoryItemByInventoryNumberUseCase(repo);

    await expect(
      useCase.execute({ inventoryNumber: 'INV-999' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should return inventory item when found by inventory number', async () => {
    const repo = new MockInventoryItemRepository();
    const item = new InventoryItem({
      id: '123',
      categoryId: 'cat-123',
      status: 'I',
      quantity: 1,
      inventoryNumber: 'INV-001',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findByInventoryNumber.mockResolvedValue(item);

    const useCase = new GetInventoryItemByInventoryNumberUseCase(repo);

    const result = await useCase.execute({ inventoryNumber: 'INV-001' });

    expect(repo.findByInventoryNumber).toHaveBeenCalledWith('INV-001');
    expect(result).toBeDefined();
    expect(result!.inventoryNumber).toBe('INV-001');
  });
});
