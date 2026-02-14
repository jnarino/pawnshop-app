import { GetAllItemsInventoryUseCase } from '../../../../../../../src/application/use-case/reports/inventory/query/GetAllItemsInventoryUseCase';
import { InventoryReportRepository } from '../../../../../../../src/domains/reports/inventory/InventoryReportRepository';
import { InventoryItemRecord } from '../../../../../../../src/domains/reports/inventory/InventoryItemRecord';
import { NotFoundError } from '../../../../../../../src/application/common/errors';

describe('GetAllItemsInventoryUseCase', () => {
  let repo: jest.Mocked<InventoryReportRepository>;
  let useCase: GetAllItemsInventoryUseCase;

  beforeEach(() => {
    repo = {
      findAllItems: jest.fn(),
    } as any;
    useCase = new GetAllItemsInventoryUseCase(repo);
  });

  it('returns rows with totals', async () => {
    const recordA = new InventoryItemRecord({
      itemType: 'Laptop',
      type: 'Electronics',
      brand: 'BrandA',
      itemDescription: 'Gaming Laptop',
      model: 'X1',
      serialNumber: 'SN-1',
      quantity: 2,
      cost: 500,
      resale: 800,
    });
    const recordB = new InventoryItemRecord({
      itemType: 'Watch',
      type: 'Jewelry',
      brand: 'BrandB',
      itemDescription: 'Smart Watch',
      model: 'S2',
      serialNumber: 'SN-2',
      quantity: 1,
      cost: 150,
      resale: 250,
    });
    repo.findAllItems.mockResolvedValue([recordA, recordB]);

    const result = await useCase.execute({});

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      itemType: 'Laptop',
      type: 'Electronics',
      brand: 'BrandA',
      quantity: 2,
      cost: 500,
      resale: 800,
    });
    expect(result.totals).toMatchObject({
      totalItems: 2,
      totalQuantity: 3,
      totalCost: 650,
      totalResale: 1050,
    });
  });

  it('throws NotFoundError when no items', async () => {
    repo.findAllItems.mockResolvedValue([]);

    await expect(useCase.execute({})).rejects.toThrow(NotFoundError);
  });
});
