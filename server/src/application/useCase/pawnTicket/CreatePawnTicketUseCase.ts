import type { IPawnTicketRepository } from '../../../domain/pawnTicket/IPawnTicketRepository';
import type { CreatePawnTicketInput } from '../../../domain/pawnTicket/PawnTicket';
import { ValidationError } from '../../errors';
import { CreateInventoryItemUseCase } from '../inventory/CreateInventoryItemUseCase';
import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';
import { pool } from '../../../infrastructure/db';
import { logger } from '../../../infrastructure/log/logger';

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
      // ✅ Auto-generate control number from database sequence
      let controlNumber = input.controlNumber;

      if (!controlNumber) {
        const result = await pool.query(`SELECT get_next_control_number() AS control_number`);
        controlNumber = result.rows[0].control_number;
        input.controlNumber = controlNumber;
        logger.info('control_number_generated', { controlNumber });
      }

      // ✅ Validate category UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (let i = 0; i < input.newInventoryItems.length; i++) {
        const itemInput = input.newInventoryItems[i];

        if (!uuidRegex.test(itemInput.categoryId)) {
          throw new ValidationError(
            `Invalid categoryId at index ${i}: "${itemInput.categoryId}" is not a valid UUID. ` +
            `Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. ` +
            `Did you mean to send a category UUID instead of category code "${itemInput.categoryId}"?`
          );
        }

        const inventoryNumber = `${controlNumber}-${i + 1}`;

        const itemId = await this.createInventoryItemUseCase.execute({
          ...itemInput,
          inventoryNumber,
          status: 'I',
        });

        inventoryItemIds.push(itemId);
      }
    } else if (input.inventoryItemIds) {
      inventoryItemIds = input.inventoryItemIds;
    }

    // ✅ Pass modified input with inventoryItemIds instead of newInventoryItems
    const ticketInput: CreatePawnTicketInput = {
      ...input,
      inventoryItemIds,
      newInventoryItems: undefined,
    };

    const ticketId = await this.repo.create(ticketInput);

    return ticketId;
  }
}
