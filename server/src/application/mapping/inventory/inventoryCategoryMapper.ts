import { InventoryCategory } from '../../../domains/inventory/InventoryCategory';
import { InventoryCategoryResponseDto } from '../../dto/inventory/query/InventoryCategoryResponseDto';

export class InventoryCategoryMapper {
  static toCategoryDto(
    category: InventoryCategory
  ): InventoryCategoryResponseDto {
    return {
      id: category.id,
      name: category.name
    };
  }
}
