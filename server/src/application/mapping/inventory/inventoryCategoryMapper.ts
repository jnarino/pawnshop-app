import { InventoryCategory } from '../../../domains/inventory/InventoryCategory';
import { InventoryCategoryTreeItemResponseDto } from '../../dto/inventory/query/InventoryCategoryTreeItemResponseDto';

export class InventoryCategoryMapper {
  static toTreeItemDto(
    category: InventoryCategory
  ): InventoryCategoryTreeItemResponseDto {
    return {
      categoryId: category.categoryId,
      subcategoryId: category.subcategoryId,
      brand: category.brand,
      path: category.path
    };
  }
}
