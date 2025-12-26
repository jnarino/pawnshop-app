


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
            // Group payments by pawnTicketId to process each ticket once
            const paymentsByTicket = new Map<string, any[]>();
            for (const payment of payments) {
                if (!paymentsByTicket.has(payment.pawnTicketId)) {
                    paymentsByTicket.set(payment.pawnTicketId, []);
                }
                paymentsByTicket.get(payment.pawnTicketId)!.push(payment);
            }

            // Process each pawn ticket once
            for (const [pawnTicketId, ticketPayments] of paymentsByTicket.entries()) {
                const firstPayment = ticketPayments[0];
                
                // Validate all payments for this ticket have the same control number
                const controlNumber = firstPayment.controlNumber;
                const allSameControlNumber = ticketPayments.every(p => p.controlNumber === controlNumber);
                if (!allSameControlNumber) {
                    throw new NotFoundError(`Multiple control numbers found for pawn ticket ${pawnTicketId}`);
                }

                // 1. Get current charges once per ticket
                const charges = await this.getPawnTicketCurrentChargesUseCase.execute({ controlNumber });

                // 2. Calculate total payment amount for this ticket
                const totalPaymentAmount = ticketPayments.reduce((sum, p) => sum + p.paymentAmount, 0);

                console.log('Payment Amount:', totalPaymentAmount, 'Redemption Amount:', charges.redemptionAmount);
                const isRedemption = totalPaymentAmount >= charges.redemptionAmount;
                console.log('Is Redemption:', isRedemption);

                const now = new Date();
                const createdDate = firstPayment.createdDate ? new Date(firstPayment.createdDate) : null;
                if (!createdDate) throw new NotFoundError('createdDate is required in input');

                // 3. Calculate new dates
                let transactionDate = now;
                let updatedAt = now;
                let defaultDate: Date;
                let maturityDate: Date;

                if (isRedemption) {
                    defaultDate = now;
                    maturityDate = now;
                } else {
                    defaultDate = new Date(transactionDate.getTime() + 60 * 24 * 60 * 60 * 1000);
                    const msPerDay = 24 * 60 * 60 * 1000;
                    const daysSinceInit = Math.floor((transactionDate.getTime() - createdDate.getTime()) / msPerDay);
                    const periodsElapsed = Math.floor(daysSinceInit / 30);
                    maturityDate = new Date(createdDate.getTime() + (periodsElapsed + 1) * 30 * msPerDay);
                }

                // 4. Update pawn_ticket once with total payment amount
                console.log('before updatePaymentFields call');
                await pawnTicketRepository.updatePaymentFields({
                    pawnTicketId,
                    paymentAmount: totalPaymentAmount,
                    transactionDate,
                    updatedAt,
                    defaultDate,
                    maturityDate,
                    setRedeemed: isRedemption
                });
                console.log('after updatePaymentFields call');

                // 5. If redemption, update inventory items to status 'U'
                if (isRedemption) {
                    console.log('Setting inventory items to U for pawnTicketId:', pawnTicketId);
                    await inventoryItemRepository.setStatusByPawnTicket(pawnTicketId, 'U');
                }

                // 6. Create a single store_transaction with all tenders for this ticket
                const tenderArray = ticketPayments.map(p => p.tender);
                console.log('Creating store transaction with', tenderArray.length, 'tender(s)');
                await storeTransactionRepository.createPayment({
                    pawnTicketId,
                    controlNumber,
                    clerkUserId,
                    typeId: isRedemption ? 8 : 7,
                    amount: totalPaymentAmount,
                    tenders: tenderArray
                });
                console.log('Store transaction created');
            }
        });
    }
}
