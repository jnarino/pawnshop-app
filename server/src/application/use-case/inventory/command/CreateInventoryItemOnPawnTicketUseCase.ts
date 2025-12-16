import crypto from 'crypto';
import { InventoryItem } from '../../../../domains/inventory/InventoryItem';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import {
    createInventoryItemRequestSchema,
    CreateInventoryItemRequestDto
} from '../../../dto/inventory/command/CreateInventoryItemRequestDto';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';

/**
 * Create inventory items specifically for pawn tickets.
 * 
 * Business Rules:
 * - Status is always 'P' (Pawned)
 * - created_at is NULL (item not on inventory yet)
 * - inventory_number is auto-generated as: {controlNumber}-{itemIndex}
 *   Example: control_number='106489', first item='106489-1', second='106489-2'
 */
export class CreateInventoryItemOnPawnTicketUseCase {
    constructor(
        private readonly inventoryItemRepo: InventoryItemRepository
    ) { }

    async execute(
        input: unknown, 
        controlNumber: string, 
        itemIndex: number
    ): Promise<InventoryItemResponseDto> {
        const dto: CreateInventoryItemRequestDto =
            createInventoryItemRequestSchema.parse(input);

        const now = new Date();

        const item = new InventoryItem({
            id: crypto.randomUUID(),

            inventorySubcategoryId: dto.inventorySubcategoryId,
            status: 'P', // Always 'P' for pawn items
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

            // Auto-generate inventory_number: {controlNumber}-{itemIndex}
            inventoryNumber: `${controlNumber}-${itemIndex}`,
            lastUpdatedUserId: null,

            // created_at is NULL for pawn items (not on inventory yet)
            createdAt: null,
            updatedAt: now
        });

        const created = await this.inventoryItemRepo.create(item);
        return toInventoryItemResponseDto(created);
    }
}
