import crypto from 'crypto';
import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { ControlNumberRepository } from '../../../../domains/controlNumber/ControlNumberRepository';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionTypeId } from '../../../../domains/storeTransaction/storeTransactionTypes';
import { VoidLayawayPaymentRequestDto, voidLayawayPaymentRequestSchema } from '../../../dto/layaway/command/VoidLayawayPaymentRequestDto';
import { NotFoundError } from '../../../common/errors';

export class VoidLayawayPaymentUseCase {
  constructor(
    private readonly uow: LayawayUnitOfWork,
    private readonly controlNumberRepo: ControlNumberRepository
  ) {}

  async execute(input: unknown, clerkUserId: string): Promise<{ transactionId: string; message: string }> {
    const dto = voidLayawayPaymentRequestSchema.parse(input);

    return await this.uow.runInTransaction(async (repos) => {
      const { layawayRepository, storeTransactionRepository, inventoryItemRepository } = repos;

      // 1. Find Layaway Items
      const layawayItems = await layawayRepository.findByTicketNum(dto.ticketnum);
      if (layawayItems.length === 0) {
        throw new NotFoundError(`Layaway ticket ${dto.ticketnum} not found`);
      }

      // Check customer match
      if (layawayItems[0].customerId !== dto.customerId) {
        throw new Error(`Layaway ticket ${dto.ticketnum} does not belong to customer ${dto.customerId}`);
      }

      // 2. Validate Void Logic
      // All items share the same header totals
      const representative = layawayItems[0];
      const currentPaid = representative.totalOfPayments || 0;
      const grandTotal = representative.amount || 0;

      if (dto.amount > currentPaid) {
        throw new Error(`Cannot void ${dto.amount}, only ${currentPaid} has been paid.`);
      }

      const newTotalPaid = Math.round((currentPaid - dto.amount) * 100) / 100;
      const wasPaidOff = representative.status === 'Sold';
      const isNowPaidOff = newTotalPaid >= grandTotal; // Unlikely if we subtracted, unless negative amount passed (blocked by schema)

      const dateNow = new Date();
      const transactionId = crypto.randomUUID();
      
      // 3. Create Store Transaction (Type 17 - UNDO_LAYAWAY_PAYMENT)
      const controlNumber = await this.controlNumberRepo.getNextStoreSaleControlNumber();

      const tenders: StoreTransactionTender[] = [
        new StoreTransactionTender({
            id: crypto.randomUUID(),
            storeTransactionId: transactionId,
            sequence: 1,
            tenderTypeId: 1, // Cash - assuming we return cash or just reverse ledger
            amount: dto.amount, // Record positive amount, type implies direction? 
            // Usually tender records the face value involved.
            createdAt: dateNow
        })
      ];

      const storeTx = new StoreTransaction({
            id: transactionId,
            customerId: representative.customerId,
            clerkUserId: clerkUserId,
            controlNumber: controlNumber,
            typeId: StoreTransactionTypeId.UNDO_LAYAWAY_PAYMENT,
            occurredAt: dateNow,
            amount: dto.amount,
            taxSales: 0, // Voids usually don't affect tax accrual unless we reverse specific lines? 
                         // For SLX, we assume just payment reversal.
            stateTax: 0,
            taxExemptUsed: false,
            tenderChange: 0, 
            gunProcFee: 0,
            note: dto.note || `Void Payment for Ticket ${dto.ticketnum}`,
            tenders: tenders,
            items: [],
            createdAt: dateNow,
            updatedAt: dateNow
      });

      await storeTransactionRepository.create(storeTx, []);

      // 4. Update Layaway Rows & Revert Status if needed
      for (const item of layawayItems) {
        const needsStatusRevert = wasPaidOff && !isNowPaidOff;

        const updatedItem = new LayawayAgreement({
            ...item,
            totalOfPayments: newTotalPaid,
            lastUpdatedAt: dateNow,
            lastUpdatedUserId: clerkUserId,
            status: needsStatusRevert ? 'Active' : item.status,
            itemStatus: needsStatusRevert ? 'L' : item.itemStatus
        });

        await layawayRepository.update(updatedItem);

        // Revert Inventory if needed
        if (needsStatusRevert && item.itemsId && item.itemsId !== '0') {
             const invItem = await inventoryItemRepository.findById(item.itemsId);
             if (invItem && invItem.status === 'S') {
                 invItem.status = 'L'; // Revert to Layaway
                 await inventoryItemRepository.update(invItem);
             }
        }
      }

      return {
        transactionId,
        message: "Payment voided successfully."
      };
    });
  }
}
