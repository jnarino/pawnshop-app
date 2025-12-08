import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import {
    getInventoryItemByIdRequestSchema,
    GetInventoryItemByIdRequestDto
} from '../../../dto/inventory/query/GetInventoryItemByIdRequestDto';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';
import { NotFoundError } from '../../../common/errors';


export class GetInventoryItemByIdUseCase {
    constructor(
        private readonly inventoryItemRepo: InventoryItemRepository
    ) { }

    async execute(input: unknown): Promise<InventoryItemResponseDto> {
        const dto: GetInventoryItemByIdRequestDto =
            getInventoryItemByIdRequestSchema.parse(input);

        const item = await this.inventoryItemRepo.findById(dto.id);
        if (!item) {
            throw new NotFoundError('Inventory item not found');
        }

        return toInventoryItemResponseDto(item);
    }
}
