import crypto from 'crypto';
import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../../domains/storeTransaction/StoreTransactionItem';
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

      // 1. Find Layaway Items by controlNumber (ticketnum)
      const layawayItems = await layawayRepository.findByTicketNum(dto.controlNumber);
      if (layawayItems.length === 0) {
        throw new NotFoundError(`Layaway ticket ${dto.controlNumber} not found`);
      }

      const activeItems = layawayItems.filter(l => l.status === 'Active' || l.status === 'Defaulted');
      if (activeItems.length === 0 && layawayItems.some(l => l.status === 'Voided')) {
         throw new Error(`Layaway ticket ${dto.controlNumber} is already voided`);
      }
      
      if (activeItems.length === 0 && layawayItems.some(l => l.status === 'Sold')) {
         throw new Error(`Layaway ticket ${dto.controlNumber} is already sold. Void the pickup payment instead.`);
      }

      if (activeItems.length === 0) {
        throw new Error(`No active layaway agreements found for ticket ${dto.controlNumber}`);
      }

      const representative = activeItems[0];
      const dateNow = new Date();
      const transactionId = crypto.randomUUID();

      // 2. Calculate total amount from tenders
      const totalAmount = dto.tenders.reduce((sum, tender) => sum + tender.amount, 0);

      // 3. Create Store Transaction Items from input items
      const storeTransactionItems: StoreTransactionItem[] = [];
      for (const [index, itemDto] of dto.items.entries()) {
        let inventoryItemId: string | null = null;
        const lineAmount = (itemDto.price ?? 0) * itemDto.quantity;

        if (itemDto.inventoryItemId) {
          const inventoryItem = await inventoryItemRepository.findById(itemDto.inventoryItemId);
          if (inventoryItem) {
            inventoryItemId = inventoryItem.id;
          }
        }

        storeTransactionItems.push(new StoreTransactionItem({
          id: crypto.randomUUID(),
          storeTransactionId: transactionId,
          sequence: index + 1,
          inventoryItemId: inventoryItemId,
          description: itemDto.description || null,
          quantity: itemDto.quantity,
          lineAmount: lineAmount || null,
          lineCost: null,
          taxExempt: false,
          countyTaxExempt: false,
          returned: false,
          status: 'V', // Voided
          createdAt: dateNow
        }));
      }

      // 4. Create Store Transaction Tenders
      const tenders: StoreTransactionTender[] = dto.tenders.map((tender, index) =>
        new StoreTransactionTender({
          id: crypto.randomUUID(),
          storeTransactionId: transactionId,
          sequence: index + 1,
          tenderTypeId: tender.tenderTypeId,
          amount: -Math.abs(tender.amount), // Negative for void (refund)
          createdAt: dateNow
        })
      );

      // 5. Create Store Transaction (Type 16 - VOIDED_LAYAWAY)
      const storeTx = new StoreTransaction({
        id: transactionId,
        customerId: representative.customerId,
        clerkUserId: clerkUserId,
        controlNumber: dto.controlNumber,
        typeId: StoreTransactionTypeId.VOIDED_LAYAWAY,
        occurredAt: dateNow,
        amount: -totalAmount, // Negative for void
        taxSales: 0,
        stateTax: 0,
        taxExemptUsed: false,
        tenderChange: 0,
        gunProcFee: 0,
        note: dto.note || `Void Layaway Ticket ${dto.controlNumber}`,
        tenders: tenders,
        items: storeTransactionItems,
        createdAt: dateNow,
        updatedAt: dateNow
      });

      await storeTransactionRepository.create(storeTx, []);

      // 6. Update Inventory (Add back to Active Inventory)
      for (const item of activeItems) {
        if (item.inventoryNumber && item.itemsId) {
          await inventoryItemRepository.updateStatusAndQuantity(item.itemsId, 'I', 1);
        }
      }

      // 7. Update Layaway Agreements to Voided
      for (const item of activeItems) {
        const updatedItem = new LayawayAgreement({
          ...item,
          status: 'Voided',
          returnedAmt: totalAmount,
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
