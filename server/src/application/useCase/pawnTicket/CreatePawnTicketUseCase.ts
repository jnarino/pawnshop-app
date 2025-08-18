import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';
import { CreatePawnTicketInput } from '../../../domain/pawnTicket/PawnTicket';
import { ValidationError } from '../../errors';
import { CreateInventoryItemUseCase } from '../inventory/CreateInventoryItemUseCase';
import { CreateInventoryItemDTO } from '../../../domain/inventory/IInventoryRepository';

// Extended input shape (backward compatible): caller may provide either inventoryItemIds OR newInventoryItems
export interface CreatePawnTicketWithItemsInput extends CreatePawnTicketInput {
  newInventoryItems?: CreateInventoryItemDTO[]; // if provided, we'll create them (ignoring inventoryItemIds if both given)
}

export class CreatePawnTicketUseCase {
  constructor(private repo: PawnTicketRepository, private createInventoryItem: CreateInventoryItemUseCase) {}
  async execute(input: CreatePawnTicketWithItemsInput): Promise<string> {
    if (!input.customerId) throw new ValidationError('customerId required');
  const hasProvidedIds = Array.isArray(input.inventoryItemIds) && input.inventoryItemIds.length > 0;
  const hasNewItems = Array.isArray(input.newInventoryItems) && input.newInventoryItems.length > 0;
  if (!hasProvidedIds && !hasNewItems) throw new ValidationError('at least one inventory item required');
    // Determine inventory item IDs: either provided or created from newInventoryItems
    let inventoryIds: string[] = [];
    if (Array.isArray(input.newInventoryItems) && input.newInventoryItems.length) {
      if (!input.controlNumber) throw new ValidationError('controlNumber required when creating new inventory items');
      // auto-generate inventory numbers based on control number and order
      const base = input.controlNumber.trim();
      const created: string[] = [];
      for (let i = 0; i < input.newInventoryItems.length; i++) {
        const dto: CreateInventoryItemDTO = {
          ...input.newInventoryItems[i],
          status: 'in_pawn',
          inventoryNumber: `${base}-${i+1}`,
        };
        if (!dto.categoryId) throw new ValidationError('categoryId required for new inventory item');
        const id = await this.createInventoryItem.execute(dto, { forceInPawn: true });
        created.push(id);
      }
      inventoryIds = created;
    } else {
      if (!Array.isArray(input.inventoryItemIds) || input.inventoryItemIds.length === 0) throw new ValidationError('inventoryItemIds required');
      inventoryIds = input.inventoryItemIds;
    }
    input.inventoryItemIds = inventoryIds; // ensure passed to repo
    if (input.type === 'PAWN') {
      if (typeof input.amountFinanced !== 'number' || input.amountFinanced <= 0) throw new ValidationError('amountFinanced required');
      if (input.periodicRate !== undefined && (input.periodicRate < 0.10 || input.periodicRate > 0.25)) throw new ValidationError('periodicRate out of range');
    } else if (input.type === 'PURCHASE') {
      if (typeof input.purchaseTradeValue !== 'number' || input.purchaseTradeValue <= 0) throw new ValidationError('purchaseTradeValue required');
    } else {
      throw new ValidationError('invalid type');
    }
    return this.repo.create(input);
  }
}
