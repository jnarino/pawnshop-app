import { InventoryCategoryRepository } from '../../../src/domains/inventory/InventoryCategoryRepository';
import { InventoryCategory } from '../../../src/domains/inventory/InventoryCategory';
import { GetInventoryCategoryTreeUseCase } from '../../../src/application/use-case/inventory/query/GetInventoryCategoryTreeUseCase';

class MockInventoryCategoryRepository implements InventoryCategoryRepository {
  create = jest.fn();
  getAllAsTree = jest.fn();
}

describe('GetInventoryCategoryTreeUseCase', () => {
  it('should return category tree', async () => {
    const repo = new MockInventoryCategoryRepository();
    const categories = [
      new InventoryCategory({
        id: '1',
        name: 'Electronics',
        code: 'ELEC',
        depth: 0
      }),
      new InventoryCategory({
        id: '2',
        name: 'Laptops',
        code: 'LAPTOP',
        parentId: '1',
        depth: 1
      })
    ];
    repo.getAllAsTree.mockResolvedValue(categories);

    const useCase = new GetInventoryCategoryTreeUseCase(repo);

    const result = await useCase.execute();

    expect(repo.getAllAsTree).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Electronics');
    expect(result[1].name).toBe('Laptops');
  });

  it('should return empty array when no categories exist', async () => {
    const repo = new MockInventoryCategoryRepository();
    repo.getAllAsTree.mockResolvedValue([]);

    const useCase = new GetInventoryCategoryTreeUseCase(repo);

    const result = await useCase.execute();

    expect(result).toHaveLength(0);
  });
});
