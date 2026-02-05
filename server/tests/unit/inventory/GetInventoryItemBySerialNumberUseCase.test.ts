import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { NotFoundError } from '../../../src/application/common/errors';
import { GetInventoryItemBySerialNumberUseCase } from '../../../src/application/use-case/inventory/query/GetInventoryItemBySerialNumberUseCase';

class MockInventoryItemRepository implements InventoryItemRepository {
  setStatusByPawnTicket = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findAvailableByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
  findByInventoryNumbers = jest.fn();
  updateStatusAndQuantity = jest.fn().mockResolvedValue(undefined);
  updateStatus = jest.fn().mockResolvedValue(undefined);
  findByParams = jest.fn().mockResolvedValue([]);
  getInventoryNumberById = jest.fn().mockResolvedValue('12345');
  getNextInventoryNumber = jest.fn();
  findByPawnTicketId = jest.fn().mockResolvedValue([]);
}

describe('GetInventoryItemBySerialNumberUseCase', () => {
  it('should throw NotFoundError if item does not exist', async () => {
    const repo = new MockInventoryItemRepository();
    repo.findBySerialNumber.mockResolvedValue(null);
    const useCase = new GetInventoryItemBySerialNumberUseCase(repo);

    await expect(
      useCase.execute({ serialNumber: 'SN-999' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should return inventory item when found by serial number', async () => {
    const repo = new MockInventoryItemRepository();
    const item = new InventoryItem({
      id: '123',
      inventorySubcategoryId: 'cat-123',
      status: 'I',
      quantity: 1,
      serialNumber: 'ABC123456',
      brand: 'Samsung',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findBySerialNumber.mockResolvedValue(item);

    const useCase = new GetInventoryItemBySerialNumberUseCase(repo);

    const result = await useCase.execute({ serialNumber: 'ABC123456' });

    expect(repo.findBySerialNumber).toHaveBeenCalledWith('ABC123456');
    expect(result).toBeDefined();
    expect(result!.serialNumber).toBe('ABC123456');
    expect(result!.brand?.id).toBe('Samsung');
  });
});
