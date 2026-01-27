import crypto from 'crypto';
import { InventoryItem } from '../../../../domains/inventory/InventoryItem';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import {
    createInventoryItemRequestSchema,
    CreateInventoryItemRequestDto
} from '../../../dto/inventory/command/CreateInventoryItemRequestDto';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';
import { ItemAttributeMapper } from '../../../service/ItemAttributeMapper';

/**
 * Create inventory items specifically for pawn/purchase transactions.
 * 
 * Business Rules:
 * - Status is 'P' (Pawned) for PAWN transactions, 'B' (Buy) for PURCHASE transactions
 * - created_at is NULL (item not on inventory yet)
 * - inventory_number is auto-generated as: {controlNumber}-{itemIndex}
 *   Example: control_number='106489', first item='106489-1', second='106489-2'
 */
export class CreateInventoryItemOnPawnTicketUseCase {
    constructor(
        private readonly inventoryItemRepo: InventoryItemRepository,
        private readonly attributeMapper: ItemAttributeMapper
    ) { }

    async execute(
        input: unknown, 
        controlNumber: string, 
        itemIndex: number,
        transactionType: 'PAWN' | 'PURCHASE' = 'PAWN'
    ): Promise<InventoryItemResponseDto> {
        const dto: CreateInventoryItemRequestDto =
            createInventoryItemRequestSchema.parse(input);

        const now = new Date();

        // Map attributes and extra based on category (jewelry vs firearm)
        const { attributes, extra } = await this.attributeMapper.mapItemAttributes(
            dto.inventorySubcategoryId,
            {
                // Jewelry attributes
                metal: dto.attributes?.metal,
                karat: dto.attributes?.karat,
                gender: dto.attributes?.gender,
                style: dto.attributes?.style,
                sizeLength: dto.attributes?.sizeLength,
                weight: dto.extra?.weight,
                weightUnit: dto.extra?.weightUnit,
                
                // Firearm attributes
                action: dto.attributes?.action,
                caliber: dto.attributes?.caliber,
                finish: dto.attributes?.finish,
                barrel: dto.attributes?.barrel,
                importer: dto.attributes?.importer,
                barrelLength: dto.extra?.barrelLength,
                condition: dto.attributes?.condition,
                
                // Stones
                stones: dto.extra?.stones,
                
                // Pass through any other fields from dto
                ...dto.attributes,
                ...dto.extra
            }
        );

        // Determine if item is firearm to apply "G-" prefix
        const isFirearm = await this.attributeMapper.isFirearmCategory(dto.inventorySubcategoryId);
        
        // Auto-generate inventory_number: {controlNumber}-{itemIndex}
        let inventoryNumber = `${controlNumber}-${itemIndex}`;
        let legacyInventoryNumber = dto.legacyInventoryNumber ?? null;

        if (isFirearm) {
            inventoryNumber = `G-${inventoryNumber}`;
            if (legacyInventoryNumber) {
                legacyInventoryNumber = `G-${legacyInventoryNumber}`;
            }
        }

        const item = new InventoryItem({
            id: crypto.randomUUID(),

            inventorySubcategoryId: dto.inventorySubcategoryId,
            status: transactionType === 'PURCHASE' ? 'B' : 'P', // 'B' for purchase, 'P' for pawn
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

            extra,
            attributes,

            legacyInventoryNumber: legacyInventoryNumber,
            legacyItemGuid: dto.legacyItemGuid ?? null,
            legacyCategoryDescription: dto.legacyCategoryDescription ?? null,
            legacyBrandColorDescription: dto.legacyBrandColorDescription ?? null,

            inventoryNumber,
            lastUpdatedUserId: null,

            // created_at is NULL for pawn items (not on inventory yet)
            createdAt: null,
            updatedAt: now
        });

        const created = await this.inventoryItemRepo.create(item);
        return toInventoryItemResponseDto(created);
    }
}
