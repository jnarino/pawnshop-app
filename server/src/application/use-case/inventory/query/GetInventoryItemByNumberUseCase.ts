import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { NotFoundError } from '../../../common/errors';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';

import {
    GetInventoryItemByNumberRequestDto,
    getInventoryItemByNumberRequestSchema
} from '../../../dto/inventory/query/GetInventoryItemByNumberRequestDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';

export class GetInventoryItemByNumberUseCase {
    constructor(private readonly inventoryRepo: InventoryItemRepository) { }

    async execute(input: unknown): Promise<InventoryItemResponseDto> {
        const { inventoryNumber }: GetInventoryItemByNumberRequestDto =
            getInventoryItemByNumberRequestSchema.parse(input);

        const item = await this.inventoryRepo.findByInventoryNumber(inventoryNumber);

        if (!item) {
            throw new NotFoundError(`Inventory item with number ${inventoryNumber} not found`);
        }

        return toInventoryItemResponseDto(item);
    }
}
