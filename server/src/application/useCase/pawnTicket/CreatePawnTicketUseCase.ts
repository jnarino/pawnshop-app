import type { IPawnTicketRepository } from '../../../domain/pawnTicket/IPawnTicketRepository';
import { CreatePawnTicketInput, PawnTicket, buildPawnTicket } from '../../../domain/pawnTicket/PawnTicket';
import { ValidationError } from '../../errors';
import { CreateInventoryItemUseCase } from '../inventory/CreateInventoryItemUseCase';
import { pool } from '../../../infrastructure/db';
import { logger } from '../../../infrastructure/log/logger';
import { v4 as uuidv4 } from 'uuid';


export class CreatePawnTicketUseCase {
  constructor(
    private readonly repo: IPawnTicketRepository, // ✅ Use interface
    private readonly createInventoryItemUseCase: CreateInventoryItemUseCase
  ) { }

  async execute(input: CreatePawnTicketInput): Promise<any> {
    // Validate input
    if (!input.customerId) throw new ValidationError('customerId is required');

    const hasExisting = Array.isArray(input.inventoryItemIds) && input.inventoryItemIds.length > 0;
    const hasNew = Array.isArray(input.newInventoryItems) && input.newInventoryItems.length > 0;

    if (!hasExisting && !hasNew) {
      throw new ValidationError('Either inventoryItemIds or newInventoryItems required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      logger.info('pawn_ticket_transaction_begin', { customerId: input.customerId });

      const controlNumber = input.controlNumber ?? await this.repo.getNextControlNumber();
      const id = uuidv4();
      const now = new Date();
      
      const ticket = buildPawnTicket(id, { ...input, controlNumber }, now);

      // Create inventory items first if provided
      const inventoryItemIds: string[] = [...(input.inventoryItemIds || [])];
      
      if (input.newInventoryItems && input.newInventoryItems.length > 0) {
        for (let i = 0; i < input.newInventoryItems.length; i++) {
          const itemInput = input.newInventoryItems[i];
          const inventoryNumber = `${controlNumber}-${inventoryItemIds.length + i + 1}`;

          const itemId = await this.createInventoryItemUseCase.createInTransaction(client, {
            ...itemInput,
            inventoryNumber,
            status: 'I',
          });
          inventoryItemIds.push(itemId);
        }
      }

      // Update ticket with all inventory item IDs
      ticket.inventoryItemIds = inventoryItemIds;

      // ✅ Create the pawn ticket using the built ticket object directly
      await this.repo.createInTransaction(client, ticket);

      await client.query('COMMIT');

      // Return complete ticket data with inventory items
      const inventoryItems = await Promise.all(
        inventoryItemIds.map(itemId =>
          this.createInventoryItemUseCase.findById(itemId)
        )
      );

      return {
        id: ticket.id,
        controlNumber: ticket.controlNumber,
        type: ticket.type,
        customerId: ticket.customerId,
        transactionDate: ticket.transactionDate,
        maturityDate: ticket.maturityDate,
        defaultDate: ticket.defaultDate,
        amountFinanced: ticket.amountFinanced,
        financeCharge: ticket.financeCharge,
        totalOfPayments: ticket.totalOfPayments,
        annualPercentageRate: ticket.annualPercentageRate,
        inventoryItems: inventoryItems.filter(Boolean)
      };

    } catch (error) {
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
