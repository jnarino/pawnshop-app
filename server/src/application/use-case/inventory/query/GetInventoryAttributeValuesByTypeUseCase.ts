import { InventoryAttributeRepository } from '../../../../domains/inventory/InventoryAttributeRepository';
import { InventoryAttributeValueResponseDto } from '../../../dto/inventory/query/InventoryAttributeValueResponseDto';
import {
  GetAttributeValuesByTypeRequestDto,
  getAttributeValuesByTypeRequestSchema
} from '../../../dto/inventory/query/GetAttributeValuesByTypeRequestDto';
import { toInventoryAttributeValueResponseDto } from '../../../mapping/inventory/inventoryAttributeMapper';

export class GetInventoryAttributeValuesByTypeUseCase {
  constructor(private readonly attributeRepo: InventoryAttributeRepository) {}

  async execute(input: unknown): Promise<InventoryAttributeValueResponseDto[]> {
    const { attributeTypeId }: GetAttributeValuesByTypeRequestDto =
      getAttributeValuesByTypeRequestSchema.parse(input);

    const values = await this.attributeRepo.findValuesByTypeId(attributeTypeId);
    return values.map(toInventoryAttributeValueResponseDto);
  }
}
