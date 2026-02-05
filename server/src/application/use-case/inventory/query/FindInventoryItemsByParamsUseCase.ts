import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import {
  FindInventoryItemsByParamsRequestDto,
  findInventoryItemsByParamsRequestSchema
} from '../../../dto/inventory/query/FindInventoryItemsByParamsRequestDto';
import { InventoryItemSearchResponseDto } from '../../../dto/inventory/query/InventoryItemSearchResponseDto';
import { toInventoryItemSearchResponseDto } from '../../../mapping/inventory/inventoryItemMappers';

export class FindInventoryItemsByParamsUseCase {
  constructor(private readonly inventoryItemRepository: InventoryItemRepository) {}

  async execute(input: unknown): Promise<InventoryItemSearchResponseDto[]> {
    const dto: FindInventoryItemsByParamsRequestDto =
      findInventoryItemsByParamsRequestSchema.parse(input);

    const items = await this.inventoryItemRepository.findByParams(dto);
    return items.map(toInventoryItemSearchResponseDto);
  }
}
