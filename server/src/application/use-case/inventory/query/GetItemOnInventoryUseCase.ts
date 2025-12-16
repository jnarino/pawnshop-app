import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { NotFoundError } from '../../../common/errors';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';

import {
  GetInventoryItemByNumberRequestDto,
  getInventoryItemByNumberRequestSchema
} from '../../../dto/inventory/query/GetInventoryItemByNumberRequestDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';

/**
 * Get inventory item that is currently on inventory (status = 'I').
 * This is used when looking up items available for pawn transactions.
 */
export class GetItemOnInventoryUseCase {
  constructor(private readonly inventoryRepo: InventoryItemRepository) {}

  async execute(input: unknown): Promise<InventoryItemResponseDto> {
    const { inventoryNumber }: GetInventoryItemByNumberRequestDto =
      getInventoryItemByNumberRequestSchema.parse(input);

    // First check if item exists on inventory
    const itemOnInventory = await this.inventoryRepo.findAvailableByInventoryNumber(inventoryNumber);
    
    if (itemOnInventory) {
      return toInventoryItemResponseDto(itemOnInventory);
    }

    // If not on inventory, check if it exists with any status
    const itemAnyStatus = await this.inventoryRepo.findByInventoryNumber(inventoryNumber);
    
    if (itemAnyStatus) {
      // Item exists but is not available for sale
      throw new NotFoundError(`The item with inventory number ${inventoryNumber} is not available for sale`);
    }
    
    // Item doesn't exist at all
    throw new NotFoundError(`Item ${inventoryNumber} not found`);
  }
}
