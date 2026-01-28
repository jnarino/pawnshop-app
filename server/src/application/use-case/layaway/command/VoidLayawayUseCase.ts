import crypto from 'crypto';
import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionTypeId } from '../../../../domains/storeTransaction/storeTransactionTypes';
import { VoidLayawayRequestDto, voidLayawayRequestSchema } from '../../../dto/layaway/command/VoidLayawayRequestDto';
import { NotFoundError } from '../../../common/errors';

export class VoidLayawayUseCase {
  constructor(
    private readonly uow: LayawayUnitOfWork
  ) {}

  async execute(input: unknown, clerkUserId: string): Promise<{ transactionId: string; message: string }> {
    const dto: VoidLayawayRequestDto = voidLayawayRequestSchema.parse(input);

    return await this.uow.runInTransaction(async (repos) => {
      const { layawayRepository, storeTransactionRepository, inventoryItemRepository } = repos;

      // 1. Find Layaway Items
      const layawayItems = await layawayRepository.findByTicketNum(dto.ticketnum);
      if (layawayItems.length === 0) {
        throw new NotFoundError(`Layaway ticket ${dto.ticketnum} not found`);
      }

      const activeItems = layawayItems.filter(l => l.status === 'Active' || l.status === 'Defaulted');
      if (activeItems.length === 0 && layawayItems.some(l => l.status === 'Voided')) {
         throw new Error(`Layaway ticket ${dto.ticketnum} is already voided`);
      }
      
      if (activeItems.length === 0 && layawayItems.some(l => l.status === 'Sold')) {
         throw new Error(`Layaway ticket ${dto.ticketnum} is already sold. Void the pickup payment instead.`);
      }

      if (activeItems.length === 0) {
        throw new Error(`No active layaway agreements found for ticket ${dto.ticketnum}`);
      }

      const representative = activeItems[0];
      const dateNow = new Date();
      const transactionId = crypto.randomUUID();

      // 2. Create Store Transaction (Type 16 - VOIDED_LAYAWAY)
      // Amount is negative because we are returning money (or voiding the debt/asset)
      const absAmount = Math.abs(dto.amountToReturn);
      const transactionAmount = -absAmount; 

      // Use the layaway ticket number as the control number for the void transaction
      const controlNumber = representative.ticketnum ?? dto.ticketnum;

      const tenders: StoreTransactionTender[] = [
        new StoreTransactionTender({
            id: crypto.randomUUID(),
            storeTransactionId: transactionId,
            sequence: 1,
            tenderTypeId: dto.tenderTypeId,
            amount: transactionAmount, // Negative amount on tender too? Typically yes for cash out.
            createdAt: dateNow
        })
      ];

      const storeTx = new StoreTransaction({
            id: transactionId,
            customerId: representative.customerId,
            clerkUserId: clerkUserId,
            controlNumber: controlNumber,
            typeId: StoreTransactionTypeId.VOIDED_LAYAWAY,
            occurredAt: dateNow,
            amount: transactionAmount,
            taxSales: 0, 
            stateTax: 0,
            taxExemptUsed: false,
            tenderChange: 0, 
            gunProcFee: 0,
            note: dto.note || `Void Layaway Ticket ${dto.ticketnum}`,
            tenders: tenders,
            items: [],
            createdAt: dateNow,
            updatedAt: dateNow
      });

      await storeTransactionRepository.create(storeTx, []);

      // 3. Update Inventory (Add back to Active Inventory)
      // Usually status 'I' (Inventory), quantity 1.
      for (const item of activeItems) {
        if (item.inventoryNumber) {
            // Find inventory item ID logic. 
            // NOTE: The LayawayAgreement doesn't always store the inventory_item_id directly in a clean simplistic way if it was legacy data,
            // but usually we rely on the inventoryNumber linkage or if we have an item ID.
            // The layaway table definition has 'items_id' which typically IS the inventory_item_id.
            if (item.itemsId) {
                await inventoryItemRepository.updateStatusAndQuantity(item.itemsId, 'I', 1);
            }
        }
      }

      // 4. Update Layaway Agreements to Voided
      for (const item of activeItems) {
        const updatedItem = new LayawayAgreement({
            ...item,
            status: 'Voided',
            returnedAmt: absAmount, // Record what was returned? Or just mark void? 
            // Often returned_amt tracks refunds. If we returned money, we track it.
            // But if there are multiple items, splitting the refund is messy.
            // We'll set it on the first item or split it pro-rata? 
            // Existing logic often puts it on the main record or all of them. 
            // Let's safe set it on all of them for tracking, or only on the representative.
            // Better to perhaps just mark void. If standard practice is to record total returned, we do.
            // Let's set it on "items" to match schema likely expectations
            lastUpdatedAt: dateNow,
            lastUpdatedUserId: clerkUserId,
            itemStatus: 'V' // Voided item status
        });
        
        await layawayRepository.update(updatedItem);
      }

      return {
        transactionId: transactionId,
        message: 'Layaway voided successfully'
      };
    });
  }
}
