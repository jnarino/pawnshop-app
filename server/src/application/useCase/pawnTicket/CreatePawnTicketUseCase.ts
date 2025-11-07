import type { IPawnTicketRepository } from '../../../domain/pawnTicket/IPawnTicketRepository';
import { computeApr, CreatePawnTicketInput } from '../../../domain/pawnTicket/PawnTicket';
import { ValidationError } from '../../errors';
import { CreateInventoryItemUseCase } from '../inventory/CreateInventoryItemUseCase';
import { CustomerRepository } from '../../../infrastructure/persistence/CustomerRepository';
import { RatePlanRepository } from '../../../infrastructure/persistence/RatePlanRepository';
import { StoreTransactionRepository } from '../../../infrastructure/persistence/StoreTransactionRepository';
import { GunlogRepository } from '../../../infrastructure/persistence/GunlogRepository';

import { pool } from '../../../infrastructure/db';
import { logger } from '../../../infrastructure/log/logger';
import { v4 as uuidv4 } from 'uuid';

export class CreatePawnTicketUseCase {
  constructor(
    private readonly pawnTicketRepo: IPawnTicketRepository,
    private readonly customerRepo: CustomerRepository,
    private readonly ratePlanRepo: RatePlanRepository,
    private readonly storeTransactionRepo: StoreTransactionRepository,
    private readonly gunlogRepo: GunlogRepository,
    private readonly createInventoryItemUseCase: CreateInventoryItemUseCase
  ) {}

  async execute(input: CreatePawnTicketInput & {
    clerkUserId?: string;
    ratePlanId?: string;
    disbursementTenders?: Array<{ tenderTypeId: number; amount: number }>;
  }): Promise<any> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      logger.info('pawn_ticket_creation_begin', { customerId: input.customerId });

      // 1. Lock and verify customer
      const customer = await this.customerRepo.lockCustomer(input.customerId);
      if (!customer) {
        throw new ValidationError('Customer not found or already locked');
      }

      // 2. Resolve rate plan
      const ratePlan = input.ratePlanId
        ? await this.ratePlanRepo.findById(input.ratePlanId)
        : await this.ratePlanRepo.findFirstActive();

      if (!ratePlan) {
        throw new ValidationError('Rate plan not found');
      }

      const txnDate = input.transactionDate ? new Date(input.transactionDate) : new Date();

      // 3. Generate control number
      const controlNumber = await this.pawnTicketRepo.getNextControlNumber();

      // 4. Create inventory items
      const itemIds: string[] = [];
      const createdItems: any[] = [];

      if (input.newInventoryItems?.length) {
        for (let i = 0; i < input.newInventoryItems.length; i++) {
          const itemInput = input.newInventoryItems[i];
          const inventoryNumber = `${controlNumber}-${i + 1}`;

          const itemId = await this.createInventoryItemUseCase.createInTransaction(client, {
            ...itemInput,
            inventoryNumber,
            status: 'P', // Pledged status
          });

          itemIds.push(itemId);
          
          // ✅ Use transaction-aware findById to ensure we can see the newly created item
          const item = await this.createInventoryItemUseCase.findByIdInTransaction(client, itemId);
          if (!item) {
            throw new ValidationError(`Failed to retrieve created inventory item ${itemId}`);
          }
          createdItems.push(item);
        }
      }

      // Add existing items if provided
      if (input.inventoryItemIds && input.inventoryItemIds.length > 0) {
        for (const existingItemId of input.inventoryItemIds) {
          const item = await this.createInventoryItemUseCase.findById(existingItemId);
          if (!item) {
            throw new ValidationError(`Inventory item ${existingItemId} not found`);
          }
          
          // Update status to pledged
          await this.createInventoryItemUseCase.update(existingItemId, { status: 'P' });
          
          itemIds.push(existingItemId);
          createdItems.push(item);
        }
      }

      // 5. Compute finance terms
      const principal = input.amountFinanced || 0;
      const periodRate = input.periodicRate ?? ratePlan.periodic_rate;
      const financeCharge = Math.max(principal * periodRate, ratePlan.min_finance_charge);
      const totalOfPayments = principal + financeCharge;

      // Calculate dates
      const maturityDate = new Date(txnDate);
      maturityDate.setDate(maturityDate.getDate() + ratePlan.period_days);
      
      const defaultDate = new Date(maturityDate);
      defaultDate.setDate(defaultDate.getDate() + ratePlan.grace_days);

      const paidThroughDate = new Date(txnDate);
      const nextChargeDate = new Date(paidThroughDate);
      nextChargeDate.setDate(nextChargeDate.getDate() + ratePlan.period_days);

      // 6. Create pawn ticket
      const pawnTicketId = uuidv4();
      await this.pawnTicketRepo.createInTransaction(client, {
        id: pawnTicketId,
        controlNumber,
        type: input.type || 'PAWN',
        customerId: input.customerId,
        pawnStatus: 'active',
        inventoryItemIds: itemIds,
        amountFinanced: principal,
        financeCharge,
        periodicRate: periodRate,
        totalOfPayments,
        annualPercentageRate: computeApr(periodRate, ratePlan.period_days),
        purchaseTradeValue: input.type === 'PURCHASE' ? (input.purchaseTradeValue ?? null) : null,
        transactionDate: txnDate.toISOString(),
        maturityDate: maturityDate.toISOString(),
        defaultDate: defaultDate.toISOString(),
        ratePlanId: ratePlan.id,
        paidThroughDate: paidThroughDate.toISOString().split('T')[0],
        nextChargeDate: nextChargeDate.toISOString().split('T')[0],
        interestCredit: 0,
        createdAt: txnDate.toISOString(),
        updatedAt: txnDate.toISOString()
      });

      // 7. Record store transaction
      const disbursement = await this.storeTransactionRepo.createDisbursement(client, {
        customerId: input.customerId,
        clerkUserId: input.clerkUserId,
        amount: principal,
        note: `Pawn ticket #${controlNumber}`,
        controlNumber,
        tenders: input.disbursementTenders || [{ tenderTypeId: 1, amount: principal }],
        occurredAt: txnDate
      });

      // 8. Create gunlog entries for firearms
      const gunlogNumbers: number[] = [];
      for (const item of createdItems) {
        // ✅ Fix: Add null check and use correct property name
        if (item && item.categoryId && await this.isFirearmItem(item.categoryId)) {
          const gunlogNumber = await this.gunlogRepo.createAcquisitionEntry(client, {
            inventoryItemId: item.id,
            customerId: input.customerId,
            storeTransactionId: disbursement.id,
            acquisitionDate: txnDate,
            item
          });
          gunlogNumbers.push(gunlogNumber);
        }
      }

      // 9. Unlock customer
      await this.customerRepo.unlockCustomer(input.customerId);

      await client.query('COMMIT');

      return {
        pawnTicket: {
          id: pawnTicketId,
          controlNumber,
          // ...other fields...
        },
        customer,
        items: createdItems,
        disbursement,
        gunlogNumbers: gunlogNumbers.length > 0 ? gunlogNumbers : undefined
      };

    } catch (error) {
      await client.query('ROLLBACK');

      // Always unlock customer on error
      try {
        await this.customerRepo.unlockCustomer(input.customerId);
      } catch (unlockError) {
        logger.error('customer_unlock_failed', { customerId: input.customerId });
      }

      throw error;
    } finally {
      client.release();
    }
  }

  private async isFirearmItem(categoryId: string): Promise<boolean> {
    return this.gunlogRepo.isFirearmCategory(categoryId);
  }
}
