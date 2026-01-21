import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { CreateInventoryItemUseCase } from '../../../src/application/use-case/inventory/command/CreateInventoryItemUseCase';
import { ItemAttributeMapper } from '../../../src/application/service/ItemAttributeMapper';

class MockInventoryItemRepository implements InventoryItemRepository {
  setStatusByPawnTicket = jest.fn();
  create = jest.fn(async (i: InventoryItem) => i);
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findAvailableByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
  findByInventoryNumbers = jest.fn();
  updateStatusAndQuantity = jest.fn().mockResolvedValue(undefined);
  getInventoryNumberById = jest.fn().mockResolvedValue('12345');
  getNextInventoryNumber = jest.fn().mockResolvedValue('12345');
}

class MockItemAttributeMapper {
  mapItemAttributes = jest.fn(async (subcategoryId: string, input: any) => {
    // Pass through all fields to attributes and extra
    const attributes: any = {};
    const extra: any = {};
    
    // Separate known attribute fields from extra fields
    const attributeFields = ['metal', 'karat', 'gender', 'style', 'sizeLength', 'action', 'caliber', 'finish', 'barrel', 'importer', 'condition', 'color'];
    
    for (const [key, value] of Object.entries(input)) {
      if (attributeFields.includes(key)) {
        attributes[key] = value;
      } else {
        extra[key] = value;
      }
    }
    
    return { attributes, extra };
  });
}

describe('CreateInventoryItemUseCase', () => {
  const validSubcategoryId = '550e8400-e29b-41d4-a716-446655440000';
  const validBrandId = '550e8400-e29b-41d4-a716-446655440001';

  it('should create an inventory item with required fields', async () => {
    const repo = new MockInventoryItemRepository();
    const mapper = new MockItemAttributeMapper();
    const useCase = new CreateInventoryItemUseCase(repo, mapper as any);

    const result = await useCase.execute({
      inventorySubcategoryId: validSubcategoryId,
      brand: validBrandId,
      priceAmount: 100,
      status: 'I',
      quantity: 1
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.inventorySubcategory.id).toBe(validSubcategoryId);
    expect(result.status).toBe('I');
    expect(result.quantity).toBe(1);
  });

  it('should create an inventory item with all optional fields', async () => {
    const repo = new MockInventoryItemRepository();
    const mapper = new MockItemAttributeMapper();
    const useCase = new CreateInventoryItemUseCase(repo, mapper as any);

    const result = await useCase.execute({
      inventorySubcategoryId: validSubcategoryId,
      status: 'I',
      quantity: 1,
      brand: validBrandId,
      model: 'iPhone 13',
      serialNumber: 'ABC123456',
      itemDescription: 'Mint condition',
      priceAmount: 500,
      resale: 600
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.brand?.id).toBe(validBrandId);
    expect(result.model).toBe('iPhone 13');
    expect(result.serialNumber).toBe('ABC123456');
  });

  it('should handle extra and attributes fields', async () => {
    const repo = new MockInventoryItemRepository();
    const mapper = new MockItemAttributeMapper();
    const useCase = new CreateInventoryItemUseCase(repo, mapper as any);

    const result = await useCase.execute({
      inventorySubcategoryId: validSubcategoryId,
      brand: validBrandId,
      priceAmount: 200,
      status: 'I',
      quantity: 1,
      extra: { custom: 'value' },
      attributes: { color: 'blue' }
    });

    expect(repo.create).toHaveBeenCalled();
    expect(result.extra).toEqual({ custom: 'value' });
    expect(result.attributes).toEqual({ color: 'blue' });
  });

  it('should generate inventory number if missing', async () => {
    const repo = new MockInventoryItemRepository();
    const mapper = new MockItemAttributeMapper();
    const useCase = new CreateInventoryItemUseCase(repo, mapper as any);

    const result = await useCase.execute({
      inventorySubcategoryId: validSubcategoryId,
      brand: validBrandId,
      priceAmount: 100,
      status: 'I',
      quantity: 1
    });

    expect(repo.getNextInventoryNumber).toHaveBeenCalled();
    expect(result.inventoryNumber).toBe('I-12345');
  });

  it('should use provided inventory number if present', async () => {
    const repo = new MockInventoryItemRepository();
    const mapper = new MockItemAttributeMapper();
    const useCase = new CreateInventoryItemUseCase(repo, mapper as any);

    const result = await useCase.execute({
      inventorySubcategoryId: validSubcategoryId,
      brand: validBrandId,
      priceAmount: 100,
      status: 'I',
      quantity: 1,
      inventoryNumber: 'CUSTOM-123'
    });

    expect(repo.getNextInventoryNumber).not.toHaveBeenCalled();
    expect(result.inventoryNumber).toBe('CUSTOM-123');
  });
});
