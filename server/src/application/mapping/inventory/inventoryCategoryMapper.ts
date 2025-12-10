import { InventoryCategory } from '../../../domains/inventory/InventoryCategory';
import { InventoryCategoryTreeItemResponseDto } from '../../dto/inventory/query/InventoryCategoryTreeItemResponseDto';

export class InventoryCategoryMapper {
  static toTreeItemDto(
    category: InventoryCategory
  ): InventoryCategoryTreeItemResponseDto {
    return {
      id: category.id,
      name: category.name,
      code: category.code,
      parentId: category.parentId,
      path: category.path,
      depth: category.depth
    };
  }
}
