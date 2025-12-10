import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { InventoryCategoryMapper } from '../../../mapping/inventory/inventoryCategoryMapper';
import { InventoryCategoryTreeItemResponseDto } from '../../../dto/inventory/query/InventoryCategoryTreeItemResponseDto';

export class GetInventoryCategoryTreeUseCase {
  constructor(
    private readonly inventoryCategoryRepository: InventoryCategoryRepository
  ) {}

  async execute(): Promise<InventoryCategoryTreeItemResponseDto[]> {
    const categories = await this.inventoryCategoryRepository.getAllAsTree();
    return categories.map(InventoryCategoryMapper.toTreeItemDto);
  }
}
