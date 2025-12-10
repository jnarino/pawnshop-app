import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { NotFoundError } from '../../../src/application/common/errors';
import { GetInventoryItemByIdUseCase } from '../../../src/application/use-case/inventory/query/GetInventoryItemByIdUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
}

describe('GetInventoryItemByIdUseCase', () => {
  it('should throw NotFoundError if item does not exist', async () => {
    const repo = new MockInventoryItemRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new GetInventoryItemByIdUseCase(repo);

    await expect(
      useCase.execute({ id: '999' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should return inventory item when found', async () => {
    const repo = new MockInventoryItemRepository();
    const item = new InventoryItem({
      id: '123',
      categoryId: 'cat-123',
      status: 'I',
      quantity: 1,
      brand: 'Apple',
      model: 'iPhone',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(item);

    const useCase = new GetInventoryItemByIdUseCase(repo);

    const result = await useCase.execute({ id: '123' });

    expect(repo.findById).toHaveBeenCalledWith('123');
    expect(result.brand).toBe('Apple');
    expect(result.model).toBe('iPhone');
  });
});
