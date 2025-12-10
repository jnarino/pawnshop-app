import { v4 as uuidv4 } from 'uuid';
import { InventoryItem } from '../../../../domains/inventory/InventoryItem';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import {
    createInventoryItemRequestSchema,
    CreateInventoryItemRequestDto
} from '../../../dto/inventory/command/CreateInventoryItemRequestDto';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';

export class CreateInventoryItemUseCase {
    constructor(
        private readonly inventoryItemRepo: InventoryItemRepository
    ) { }

    async execute(input: unknown): Promise<InventoryItemResponseDto> {
        const dto: CreateInventoryItemRequestDto =
            createInventoryItemRequestSchema.parse(input);

        const now = new Date();

        const item = new InventoryItem({
            id: uuidv4(),

            categoryId: dto.categoryId,
            status: dto.status ?? 'I',
            quantity: dto.quantity ?? 1,

            brand: dto.brand ?? null,
            model: dto.model ?? null,
            serialNumber: dto.serialNumber ?? null,
            colorId: dto.colorId ?? null,
            itemCondition: dto.itemCondition ?? null,
            ownerMark: dto.ownerMark ?? null,
            itemDescription: dto.itemDescription ?? null,

            priceAmount: dto.priceAmount ?? null,
            resale: dto.resale ?? null,
            minResale: dto.minResale ?? null,
            itemReplace: dto.itemReplace ?? null,

            extra: dto.extra ?? {},
            attributes: dto.attributes ?? {},

            legacyInventoryNumber: dto.legacyInventoryNumber ?? null,
            legacyItemGuid: dto.legacyItemGuid ?? null,
            legacyCategoryDescription: dto.legacyCategoryDescription ?? null,
            legacyBrandColorDescription: dto.legacyBrandColorDescription ?? null,

            inventoryNumber: dto.inventoryNumber ?? null,
            lastUpdatedUserId: null, // we can set this from auth context later

            createdAt: now,
            updatedAt: now
        });

        const saved = await this.inventoryItemRepo.create(item);
        return toInventoryItemResponseDto(saved);
    }
}
