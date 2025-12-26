


import { NotFoundError } from '../../../common/errors';
import { PawnTicketPaymentRequestDto, pawnTicketPaymentRequestSchema } from '../../../dto/pawnTicket/command/PawnTicketPaymentRequestDto';
import { GetPawnTicketCurrentChargesUseCase } from '../query/GetPawnTicketCurrentChargesUseCase';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { any } from 'zod';


export class PayPawnTicketUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase
    ) { }

    async execute(input: unknown): Promise<void> {
        const { items, tenders, clerkUserId } = pawnTicketPaymentRequestSchema.parse(input);
        // Prepare a copy of tenders with numeric amounts
        const tenderQueue = tenders.map(t => ({
            ...t,
            amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount
        }));

        // Build payments array by splitting tenders across items
        const payments: any = [];
        for (const item of items) {
            let amountLeft = item.amountPaid;
            while (amountLeft > 0 && tenderQueue.length > 0) {
                const tender = tenderQueue[0];
                const tenderAmount = Math.min(amountLeft, tender.amount);
                payments.push({
                    pawnTicketId: item.pawnTicketId,
                    controlNumber: item.controlNumber,
                    paymentAmount: tenderAmount,
                    clerkUserId: clerkUserId,
                    tender: {
                        tenderTypeId: tender.tenderTypeId,
                        amount: tenderAmount
                    },
                    createdDate: item.createdDate,
                });
                amountLeft -= tenderAmount;
                tender.amount -= tenderAmount;
                if (tender.amount <= 0.00001) {
                    tenderQueue.shift();
                }
            }
            if (amountLeft > 0) {
                throw new NotFoundError('Not enough tender amount to cover all payments');
            }
        }

        await this.pawnTicketUnitOfWork.runInTransaction(async ({
            inventoryItemRepository,
            pawnTicketRepository,
            storeTransactionRepository,
            dbClient
        }) => {
            for (const payment of payments) {
                // 1. Get current charges using controlNumber from DTO
                const charges = await this.getPawnTicketCurrentChargesUseCase.execute({ controlNumber: payment.controlNumber });
                const now = new Date();
                // 2. Determine if payment is redemption
                const isRedemption = payment.paymentAmount >= charges.redemptionAmount;
                // 3. Calculate new dates
                let transactionDate = now;
                let updatedAt = now;
                let defaultDate: Date;
                let maturityDate: Date;
                // Accept createdDate from input (must be provided)
                const createdDate = payment.createdDate ? new Date(payment.createdDate) : null;
                if (!createdDate) throw new NotFoundError('createdDate is required in input');
                if (isRedemption) {
                    defaultDate = now;
                    maturityDate = now;
                } else {
                    // For payment, defaultDate is 60 days from transactionDate
                    defaultDate = new Date(transactionDate.getTime() + 60 * 24 * 60 * 60 * 1000);
                    // Maturity date moves 30 days forward from the last period, counting from createdDate
                    const msPerDay = 24 * 60 * 60 * 1000;
                    const daysSinceInit = Math.floor((transactionDate.getTime() - createdDate.getTime()) / msPerDay);
                    const periodsElapsed = Math.floor(daysSinceInit / 30);
                    maturityDate = new Date(createdDate.getTime() + (periodsElapsed + 1) * 30 * msPerDay);
                }
                // 4. Update pawn_ticket with all required fields (should be a repo method, e.g. updatePaymentFields)
                await pawnTicketRepository.updatePaymentFields({
                    pawnTicketId: payment.pawnTicketId,
                    paymentAmount: payment.paymentAmount,
                    transactionDate,
                    updatedAt,
                    defaultDate,
                    maturityDate,
                    setRedeemed: isRedemption
                });
                // 5. If redemption, update inventory items to status 'U'
                if (isRedemption) {
                    await inventoryItemRepository.setStatusByPawnTicket(payment.pawnTicketId, 'U');
                }
                // 6. Create store_transaction (type 8 for redemption, 7 for payment)
                await storeTransactionRepository.createPayment({
                    pawnTicketId: payment.pawnTicketId,
                    clerkUserId,
                    typeId: isRedemption ? 8 : 7,
                    amount: payment.paymentAmount,
                    tender: payment.tender
                });
            }
        });
    }
}
