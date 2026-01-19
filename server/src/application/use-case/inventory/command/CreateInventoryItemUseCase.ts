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

export class CreateInventoryItemUseCase {
    constructor(
        private readonly inventoryItemRepo: InventoryItemRepository,
        private readonly attributeMapper: ItemAttributeMapper
    ) { }

    async execute(input: unknown): Promise<InventoryItemResponseDto> {
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

        let inventoryNumber = dto.inventoryNumber;
        if (!inventoryNumber) {
            const nextNum = await this.inventoryItemRepo.getNextInventoryNumber();
            inventoryNumber = `I-${nextNum}`;
        }

        const item = new InventoryItem({
            id: crypto.randomUUID(),

            inventorySubcategoryId: dto.inventorySubcategoryId,
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

            extra,
            attributes,

            legacyInventoryNumber: dto.legacyInventoryNumber ?? null,
            legacyItemGuid: dto.legacyItemGuid ?? null,
            legacyCategoryDescription: dto.legacyCategoryDescription ?? null,
            legacyBrandColorDescription: dto.legacyBrandColorDescription ?? null,

            inventoryNumber: inventoryNumber ?? null,
            lastUpdatedUserId: null, // we can set this from auth context later

            createdAt: now,
            updatedAt: now
        });

        const saved = await this.inventoryItemRepo.create(item);
        return toInventoryItemResponseDto(saved);
    }
}
