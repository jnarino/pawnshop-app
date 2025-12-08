import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import {
    GetInventoryItemByInventoryNumberDto,
    getInventoryItemByInventoryNumberSchema
} from '../../../dto/inventory/query/GetInventoryItemByInventoryNumberDto';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';


export class GetInventoryItemByInventoryNumberUseCase {
    constructor(
        private readonly inventoryItemRepository: InventoryItemRepository
    ) { }

    async execute(input: unknown): Promise<InventoryItemResponseDto | null> {
        const dto: GetInventoryItemByInventoryNumberDto =
            getInventoryItemByInventoryNumberSchema.parse(input);

        const item = await this.inventoryItemRepository.findByInventoryNumber(
            dto.inventoryNumber
        );
        if (!item) return null;

        return toInventoryItemResponseDto(item);
    }
}
