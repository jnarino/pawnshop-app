import { InventoryAttributeRepository } from '../../../../domains/inventory/InventoryAttributeRepository';
import { InventoryAttributeTypeResponseDto } from '../../../dto/inventory/query/InventoryAttributeTypeResponseDto';
import { toInventoryAttributeTypeResponseDto } from '../../../mapping/inventory/inventoryAttributeMapper';

export class GetAllInventoryAttributeTypesUseCase {
  constructor(private readonly attributeRepo: InventoryAttributeRepository) {}

  async execute(): Promise<InventoryAttributeTypeResponseDto[]> {
    const types = await this.attributeRepo.findAllTypes();
    return types.map(toInventoryAttributeTypeResponseDto);
  }
}
