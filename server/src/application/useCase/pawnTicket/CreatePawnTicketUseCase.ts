import type { IPawnTicketRepository } from '../../../domain/pawnTicket/IPawnTicketRepository';
import type { CreatePawnTicketInput } from '../../../domain/pawnTicket/PawnTicket';
import { ValidationError } from '../../errors';
import { CreateInventoryItemUseCase } from '../inventory/CreateInventoryItemUseCase';
import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';

export class CreatePawnTicketUseCase {
  constructor(
    private readonly repo: PawnTicketRepository,
    private readonly createInventoryItemUseCase: CreateInventoryItemUseCase
  ) { }

  async execute(input: CreatePawnTicketInput): Promise<string> {
    // Validate input
    if (!input.customerId) throw new ValidationError('customerId is required');

    const hasExisting = Array.isArray(input.inventoryItemIds) && input.inventoryItemIds.length > 0;
    const hasNew = Array.isArray(input.newInventoryItems) && input.newInventoryItems.length > 0;

    if (!hasExisting && !hasNew) {
      throw new ValidationError('Either inventoryItemIds or newInventoryItems required');
    }

    let inventoryItemIds: string[] = [];

    // If creating new inventory items
    if (hasNew && input.newInventoryItems) {
      if (!input.controlNumber) {
        throw new ValidationError('controlNumber required when creating new inventory items');
      }

      // Create each inventory item with generated inventory_number
      for (let i = 0; i < input.newInventoryItems.length; i++) {
        const itemInput = input.newInventoryItems[i];
        const inventoryNumber = `${input.controlNumber}-${i + 1}`;

        const itemId = await this.createInventoryItemUseCase.execute({
          ...itemInput,
          inventoryNumber,
          status: 'I', // Default status for new items
        });

        inventoryItemIds.push(itemId);
      }
    } else if (input.inventoryItemIds) {
      inventoryItemIds = input.inventoryItemIds;
    }

    // Create pawn ticket with the inventory item IDs
    // The repository will handle building the domain object and persisting
    const ticketId = await this.repo.create({
      ...input,
      inventoryItemIds, // Use the created/provided inventory item IDs
    });

    return ticketId;
  }
}
