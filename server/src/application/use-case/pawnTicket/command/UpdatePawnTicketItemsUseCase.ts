import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository'; // Assuming this exists to check ticket existence
import { NotFoundError, ForbiddenError } from '../../../common/errors';
import { 
  UpdatePawnTicketItemsRequestDto, 
  updatePawnTicketItemsRequestSchema 
} from '../../../dto/pawnTicket/command/UpdatePawnTicketItemsRequestDto';

export class UpdatePawnTicketItemsUseCase {
  constructor(
    private readonly inventoryItemRepo: InventoryItemRepository,
    private readonly pawnTicketRepo: PawnTicketRepository
  ) {}

  async execute(input: unknown): Promise<void> {
    const { 
      pawnTicketId, 
      items, 
      clerkUserId 
    } = updatePawnTicketItemsRequestSchema.parse(input);

    // 1. Verify existence of the pawn ticket
    const pawnTicket = await this.pawnTicketRepo.findById(pawnTicketId);
    if (!pawnTicket) {
      throw new NotFoundError(`Pawn ticket ${pawnTicketId} not found`);
    }

    // 2. Fetch all existing items for this ticket to verify ownership and get current state
    const existingItems = await this.inventoryItemRepo.findByPawnTicketId(pawnTicketId);
    const existingItemMap = new Map(existingItems.map(i => [i.id, i]));

    for (const updateDto of items) {
      const currentItem = existingItemMap.get(updateDto.itemId);

      // Security Check: Item MUST belong to the targeted pawn ticket
      if (!currentItem) {
        throw new ForbiddenError(
          `Item ${updateDto.itemId} does not belong to pawn ticket ${pawnTicketId} or does not exist`
        );
      }

      // Apply updates to allowed fields only
      // "Values on the items shouldn't be allow to be modified" -> e.g. priceAmount, quantity, status
      
      if (updateDto.inventorySubcategoryId !== undefined) {
        currentItem.inventorySubcategoryId = updateDto.inventorySubcategoryId!; // Zod optional() vs optional in Entity
      }
      
      if (updateDto.brand !== undefined) currentItem.brand = updateDto.brand;
      if (updateDto.model !== undefined) currentItem.model = updateDto.model;
      if (updateDto.serialNumber !== undefined) currentItem.serialNumber = updateDto.serialNumber;
      if (updateDto.colorId !== undefined) currentItem.colorId = updateDto.colorId;
      if (updateDto.itemCondition !== undefined) currentItem.itemCondition = updateDto.itemCondition;
      if (updateDto.ownerMark !== undefined) currentItem.ownerMark = updateDto.ownerMark;
      if (updateDto.itemDescription !== undefined) currentItem.itemDescription = updateDto.itemDescription;
      
      if (updateDto.attributes !== undefined && updateDto.attributes !== null) {
        currentItem.attributes = updateDto.attributes;
      }

      // Tracking update
      currentItem.updatedAt = new Date();
      if (clerkUserId) {
        currentItem.lastUpdatedUserId = clerkUserId;
      }

      await this.inventoryItemRepo.update(currentItem);
    }
  }
}
