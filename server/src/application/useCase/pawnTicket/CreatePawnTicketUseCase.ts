import type { IPawnTicketRepository } from '../../../domain/pawnTicket/IPawnTicketRepository';
import type { CreatePawnTicketInput } from '../../../domain/pawnTicket/PawnTicket';
import { ValidationError } from '../../errors';
import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';
import { CreateInventoryItemUseCase } from '../inventory/CreateInventoryItemUseCase';
import { pool } from '../../../infrastructure/db';
import { logger } from '../../../infrastructure/log/logger';

export class CreatePawnTicketUseCase {
  constructor(
    private readonly repo: IPawnTicketRepository, // ✅ Use interface
    private readonly createInventoryItemUseCase: CreateInventoryItemUseCase
  ) {}

  async execute(input: CreatePawnTicketInput): Promise<string> {
    // Validate input
    if (!input.customerId) throw new ValidationError('customerId is required');
    
    const hasExisting = Array.isArray(input.inventoryItemIds) && input.inventoryItemIds.length > 0;
    const hasNew = Array.isArray(input.newInventoryItems) && input.newInventoryItems.length > 0;
    
    if (!hasExisting && !hasNew) {
      throw new ValidationError('Either inventoryItemIds or newInventoryItems required');
    }

    // ✅ SINGLE TRANSACTION
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      logger.info('pawn_ticket_transaction_begin', { customerId: input.customerId });

      let inventoryItemIds: string[] = [];
      let controlNumber = input.controlNumber;

      if (hasNew && input.newInventoryItems) {
        // Auto-generate control number
        if (!controlNumber) {
          const result = await client.query(`SELECT get_next_control_number() AS control_number`);
          controlNumber = result.rows[0].control_number;
          input.controlNumber = controlNumber;
          logger.info('control_number_generated', { controlNumber });
        }

        // Validate category UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        for (let i = 0; i < input.newInventoryItems.length; i++) {
          const itemInput = input.newInventoryItems[i];
          
          if (!uuidRegex.test(itemInput.categoryId)) {
            throw new ValidationError(
              `Invalid categoryId at index ${i}: "${itemInput.categoryId}" is not a valid UUID`
            );
          }
          
          const inventoryNumber = `${controlNumber}-${i + 1}`;
          
          // ✅ Create item within transaction
          const itemId = await this.createInventoryItemUseCase.executeInTransaction(client, {
            ...itemInput,
            inventoryNumber,
            status: 'I',
          });
          
          inventoryItemIds.push(itemId);
          logger.info('inventory_item_created', { itemId, inventoryNumber });
        }
      } else if (input.inventoryItemIds) {
        inventoryItemIds = input.inventoryItemIds;
      }

      // ✅ Create pawn ticket within transaction
      const ticketInput: CreatePawnTicketInput = {
        ...input,
        inventoryItemIds,
        newInventoryItems: undefined,
      };

      const ticketId = await this.repo.createInTransaction(client, ticketInput);
      
      logger.info('pawn_ticket_created', { 
        ticketId, 
        controlNumber, 
        itemCount: inventoryItemIds.length 
      });

      // ✅ COMMIT
      await client.query('COMMIT');
      logger.info('pawn_ticket_transaction_commit', { ticketId });

      return ticketId;
      
    } catch (error) {
      // ✅ ROLLBACK
      await client.query('ROLLBACK');
      logger.error('pawn_ticket_transaction_rollback', { 
        error: error instanceof Error ? error.message : String(error),
        customerId: input.customerId 
      });
      throw error;
    } finally {
      client.release();
    }
  }
}
