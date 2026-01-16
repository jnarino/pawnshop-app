import { CreateInventoryAttributeValueUseCase } from '../../../../../../src/application/use-case/inventory/command/CreateInventoryAttributeValueUseCase';
import { InventoryAttributeRepository } from '../../../../../../src/domains/inventory/InventoryAttributeRepository';
import { InventoryAttributeValue } from '../../../../../../src/domains/inventory/InventoryAttributeValue';

describe('CreateInventoryAttributeValueUseCase', () => {
  let useCase: CreateInventoryAttributeValueUseCase;
  let mockRepo: jest.Mocked<InventoryAttributeRepository>;

  beforeEach(() => {
    mockRepo = {
      createValue: jest.fn(),
      findAllTypes: jest.fn(),
      findValuesByTypeId: jest.fn(),
    };
    useCase = new CreateInventoryAttributeValueUseCase(mockRepo);
  });

  it('should create attribute value with uppercase value', async () => {
    mockRepo.createValue.mockImplementation(async (v: any) => v);

    const input = {
      attributeTypeId: '54949fb4-f3ed-4f41-8f48-fb1e9750e717',
      value: 'Red'
    };

    const result = await useCase.execute(input);

    expect(result.value).toBe('RED');
    expect(result.attributeTypeId).toBe(input.attributeTypeId);
    expect(mockRepo.createValue).toHaveBeenCalled();
  });
});
