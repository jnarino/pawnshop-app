import { randomUUID } from 'crypto';
import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { InventoryCategory } from '../../../../domains/inventory/InventoryCategory';
import {
  createInventoryCategoryRequestSchema,
  CreateInventoryCategoryRequestDto
} from '../../../dto/inventory/command/CreateInventoryCategoryRequestDto';
import { InventoryCategoryMapper } from '../../../mapping/inventory/inventoryCategoryMapper';
import { InventoryCategoryTreeItemResponseDto } from '../../../dto/inventory/query/InventoryCategoryTreeItemResponseDto';

export class CreateInventoryCategoryUseCase {
  constructor(
    private readonly inventoryCategoryRepository: InventoryCategoryRepository
  ) { }

  async execute(input: unknown): Promise<InventoryCategoryTreeItemResponseDto> {
    const dto: CreateInventoryCategoryRequestDto =
      createInventoryCategoryRequestSchema.parse(input);

    const category = new InventoryCategory({
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      brand: dto.brand,
      path: dto.path
    });

    const saved = await this.inventoryCategoryRepository.create(category);
    return InventoryCategoryMapper.toTreeItemDto(saved);
  }
}
