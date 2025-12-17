import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import {
    GetInventoryItemBySerialNumberDto,
    getInventoryItemBySerialNumberSchema
} from '../../../dto/inventory/query/GetInventoryItemBySerialNumberDto';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';
import { NotFoundError } from '../../../common/errors';


export class GetInventoryItemBySerialNumberUseCase {
    constructor(
        private readonly inventoryItemRepository: InventoryItemRepository
    ) { }

    async execute(input: unknown): Promise<InventoryItemResponseDto> {
        const dto: GetInventoryItemBySerialNumberDto =
            getInventoryItemBySerialNumberSchema.parse(input);

        const item = await this.inventoryItemRepository.findBySerialNumber(
            dto.serialNumber
        );
        if (!item) {
            throw new NotFoundError(`Inventory item with serial number ${dto.serialNumber} not found`);
        }

        return toInventoryItemResponseDto(item);
    }
}
