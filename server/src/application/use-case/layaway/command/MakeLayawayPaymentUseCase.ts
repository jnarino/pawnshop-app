import crypto from 'crypto';
import { z } from 'zod';
import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { ControlNumberRepository } from '../../../../domains/controlNumber/ControlNumberRepository';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionTypeId } from '../../../../domains/storeTransaction/storeTransactionTypes';
import { MakeLayawayPaymentRequestDto, makeLayawayPaymentRequestSchema } from '../../../dto/layaway/command/MakeLayawayPaymentRequestDto';
import { NotFoundError } from '../../../common/errors'; // Using AppError as base if needed

export class MakeLayawayPaymentUseCase {
  constructor(
    private readonly uow: LayawayUnitOfWork,
    private readonly controlNumberRepo: ControlNumberRepository
  ) {}

  async execute(input: unknown, clerkUserId: string): Promise<{ transactionId: string; message: string }> {
    const dto = makeLayawayPaymentRequestSchema.parse(input);

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

      // 2. Filter Active Items (Assume 'Active' status)
      // Note: Status logic might need refinement. Assuming 'Active' is the open state.
      // If status is 'Sold' or 'Void', we can't pay.
      const activeItems = layawayItems.filter(item => item.status === 'Active');
      
      if (activeItems.length === 0) {
        throw new Error(`Layaway ticket ${dto.ticketnum} is already closed or invalid.`);
      }

      // 3. Calculate Balances
      // Since all rows sharing the same ticketnum should have the same header info (amount, totalOfPayments),
      // we can take the first one.
      const representative = activeItems[0];
      const grandTotal = representative.amount || 0;
      const currentPaid = representative.totalOfPayments || 0;
      const balance = Math.round((grandTotal - currentPaid) * 100) / 100;

      // 4. Validate Payment
      if (dto.amount <= 0) {
          throw new Error("Payment amount must be positive");
      }
      if (dto.amount > balance) {
        throw new Error(`Payment amount ${dto.amount} exceeds balance of ${balance}`);
      }

      // 5. Update Calculations
      const newTotalPaid = Math.round((currentPaid + dto.amount) * 100) / 100;
      const isPaidOff = newTotalPaid >= grandTotal;

      // 6. Create Store Transaction
      const transactionId = crypto.randomUUID();
      const dateNow = new Date();
      
      // Determine Transaction Type
      const typeId = isPaidOff 
            ? StoreTransactionTypeId.LAYAWAY_PICKUP 
            : StoreTransactionTypeId.LAYAWAY_PAYMENT;
      
      const controlNumber = await this.controlNumberRepo.getNextStoreSaleControlNumber();

      // For pickup (Paid Off), we record the tax on the final transaction
      const txTaxSales = isPaidOff ? (representative.taxSales || 0) : 0;
      const txStateTax = isPaidOff ? (representative.stateTax || 0) : 0;
      const txTaxExempt = representative.taxExempt || false;

      const tenders: StoreTransactionTender[] = [
        new StoreTransactionTender({
            id: crypto.randomUUID(),
            storeTransactionId: transactionId,
            sequence: 1,
            tenderTypeId: dto.tenderTypeId,
            amount: dto.amount,
            createdAt: dateNow
        })
      ];

      const storeTx = new StoreTransaction({
            id: transactionId,
            customerId: representative.customerId,
            clerkUserId: clerkUserId,
            controlNumber: controlNumber, // Using Sale sequence
            typeId: typeId,
            occurredAt: dateNow,
            amount: dto.amount, // Record the payment amount as transaction amount
            taxSales: txTaxSales,
            stateTax: txStateTax,
            taxExemptUsed: txTaxExempt,
            tenderChange: 0, 
            gunProcFee: 0,
            note: dto.note || `Layaway Payment for Ticket ${dto.ticketnum}`,
            tenders: tenders,
            items: [], // No items moved in this transaction (items recorded in initial sale)
            createdAt: dateNow,
            updatedAt: dateNow
      });

      await storeTransactionRepository.create(storeTx, []);

      // 7. Update Layaway Rows & Inventory
      // We update ALL items matching the ticketnum (even if some were technically separate lines, they share the payment pool)
      // But we filtered for 'Active' ones.
      
      for (const item of activeItems) {
        // Update Agreement
        const updatedItem = new LayawayAgreement({
            ...item,
            totalOfPayments: newTotalPaid,
            lastUpdatedAt: dateNow,
            lastUpdatedUserId: clerkUserId,
            status: isPaidOff ? 'Sold' : 'Active', // Update status if sold
            numberSold: item.numberSold, // Keep quantity
            // Update item_status if needed? 
            itemStatus: isPaidOff ? 'S' : item.itemStatus 
        });

        await layawayRepository.update(updatedItem);

        // Update Inventory Status if Paid Off
        if (isPaidOff && item.itemsId && item.itemsId !== '0') {
            const invItem = await inventoryItemRepository.findById(item.itemsId);
            if (invItem) {
                invItem.status = 'S'; // Sold
                await inventoryItemRepository.update(invItem);
            }
        }
      }

        return {
            success: true,
            transactionId: transactionId,
            message: isPaidOff ? "Layaway paid in full and closed." : "Payment processed successfully."
        };
    });
  }
}
