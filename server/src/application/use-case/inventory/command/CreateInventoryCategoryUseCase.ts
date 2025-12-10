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
  ) {}

  async execute(input: unknown): Promise<InventoryCategoryTreeItemResponseDto> {
    const dto: CreateInventoryCategoryRequestDto =
      createInventoryCategoryRequestSchema.parse(input);

    const category = new InventoryCategory({
      id: randomUUID(),
      name: dto.name,
      code: dto.code,
      parentId: dto.parentId ?? null,
      path: null,
      depth: 0 // DB will compute the real depth from ltree path
    });

    const saved = await this.inventoryCategoryRepository.create(category);
    return InventoryCategoryMapper.toTreeItemDto(saved);
  }
}
