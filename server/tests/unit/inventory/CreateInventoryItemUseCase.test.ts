import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { CreateInventoryItemUseCase } from '../../../src/application/use-case/inventory/command/CreateInventoryItemUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  create = jest.fn(async (i: InventoryItem) => i);
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
}

describe('CreateInventoryItemUseCase', () => {
  it('should create an inventory item with required fields', async () => {
    const repo = new MockInventoryItemRepository();
    const useCase = new CreateInventoryItemUseCase(repo);

    const result = await useCase.execute({
      categoryId: 'cat-123',
      status: 'I',
      quantity: 1
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.categoryId).toBe('cat-123');
    expect(result.status).toBe('I');
    expect(result.quantity).toBe(1);
  });

  it('should create an inventory item with all optional fields', async () => {
    const repo = new MockInventoryItemRepository();
    const useCase = new CreateInventoryItemUseCase(repo);

    const result = await useCase.execute({
      categoryId: 'cat-123',
      status: 'I',
      quantity: 1,
      brand: 'Apple',
      model: 'iPhone 13',
      serialNumber: 'ABC123456',
      itemDescription: 'Mint condition',
      priceAmount: 500,
      resale: 600
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.brand).toBe('Apple');
    expect(result.model).toBe('iPhone 13');
    expect(result.serialNumber).toBe('ABC123456');
  });

  it('should handle extra and attributes fields', async () => {
    const repo = new MockInventoryItemRepository();
    const useCase = new CreateInventoryItemUseCase(repo);

    const result = await useCase.execute({
      categoryId: 'cat-123',
      status: 'I',
      quantity: 1,
      extra: { custom: 'value' },
      attributes: { color: 'blue' }
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.extra).toEqual({ custom: 'value' });
    expect(result.attributes).toEqual({ color: 'blue' });
  });
});
