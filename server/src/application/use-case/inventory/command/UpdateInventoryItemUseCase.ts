import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { NotFoundError } from '../../../common/errors';
import {
    updateInventoryItemRequestSchema,
    UpdateInventoryItemRequestDto
} from '../../../dto/inventory/command/UpdateInventoryItemRequestDto';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';


export class UpdateInventoryItemUseCase {
    constructor(
        private readonly inventoryItemRepo: InventoryItemRepository
    ) { }

    async execute(input: unknown): Promise<InventoryItemResponseDto> {
        const dto: UpdateInventoryItemRequestDto =
            updateInventoryItemRequestSchema.parse(input);

        const existing = await this.inventoryItemRepo.findById(dto.id);
        if (!existing) {
            throw new NotFoundError('Inventory item not found');
        }

        if (dto.categoryId !== undefined) {
            existing.categoryId = dto.categoryId;
        }
        if (dto.status !== undefined) {
            existing.status = dto.status;
        }
        if (dto.quantity !== undefined) {
            existing.quantity = dto.quantity;
        }

        if (dto.brand !== undefined) existing.brand = dto.brand ?? null;
        if (dto.model !== undefined) existing.model = dto.model ?? null;
        if (dto.serialNumber !== undefined) existing.serialNumber = dto.serialNumber ?? null;
        if (dto.colorId !== undefined) existing.colorId = dto.colorId ?? null;
        if (dto.itemCondition !== undefined) existing.itemCondition = dto.itemCondition ?? null;
        if (dto.ownerMark !== undefined) existing.ownerMark = dto.ownerMark ?? null;
        if (dto.itemDescription !== undefined) existing.itemDescription = dto.itemDescription ?? null;

        if (dto.priceAmount !== undefined) existing.priceAmount = dto.priceAmount ?? null;
        if (dto.resale !== undefined) existing.resale = dto.resale ?? null;
        if (dto.minResale !== undefined) existing.minResale = dto.minResale ?? null;
        if (dto.itemReplace !== undefined) existing.itemReplace = dto.itemReplace ?? null;

        if (dto.extra !== undefined) existing.extra = dto.extra ?? {};
        if (dto.attributes !== undefined) existing.attributes = dto.attributes ?? {};

        if (dto.legacyInventoryNumber !== undefined) {
            existing.legacyInventoryNumber = dto.legacyInventoryNumber ?? null;
        }
        if (dto.legacyItemGuid !== undefined) {
            existing.legacyItemGuid = dto.legacyItemGuid ?? null;
        }
        if (dto.legacyCategoryDescription !== undefined) {
            existing.legacyCategoryDescription = dto.legacyCategoryDescription ?? null;
        }
        if (dto.legacyBrandColorDescription !== undefined) {
            existing.legacyBrandColorDescription = dto.legacyBrandColorDescription ?? null;
        }

        if (dto.inventoryNumber !== undefined) {
            existing.inventoryNumber = dto.inventoryNumber ?? null;
        }

        existing.updatedAt = new Date();

        const saved = await this.inventoryItemRepo.update(existing);
        return toInventoryItemResponseDto(saved);
    }
}
