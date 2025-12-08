import { InventoryCategoryRepository } from '../../../src/domains/inventory/InventoryCategoryRepository';
import { InventoryCategory } from '../../../src/domains/inventory/InventoryCategory';
import { CreateInventoryCategoryUseCase } from '../../../src/application/use-case/inventory/command/CreateInventoryCategoryUseCase';

class MockInventoryCategoryRepository implements InventoryCategoryRepository {
  create = jest.fn(async (c: InventoryCategory) => c);
  getAllAsTree = jest.fn();
}

describe('CreateInventoryCategoryUseCase', () => {
  it('should create a category with minimal fields', async () => {
    const repo = new MockInventoryCategoryRepository();
    const useCase = new CreateInventoryCategoryUseCase(repo);

    const result = await useCase.execute({
      name: 'Electronics',
      code: 'ELEC',
      depth: 0
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.name).toBe('Electronics');
    expect(result.code).toBe('ELEC');
  });

  it('should create a subcategory with parent', async () => {
    const repo = new MockInventoryCategoryRepository();
    const useCase = new CreateInventoryCategoryUseCase(repo);

    const result = await useCase.execute({
      name: 'Laptops',
      code: 'LAPTOP',
      parentId: 'parent-cat-id',
      depth: 1
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.name).toBe('Laptops');
    expect(result.parentId).toBe('parent-cat-id');
  });
});
