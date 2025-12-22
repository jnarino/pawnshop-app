


import { NotFoundError } from '../../../common/errors';
import { PawnTicketPaymentBatchRequestDto, pawnTicketPaymentBatchRequestSchema } from '../../../dto/pawnTicket/command/PawnTicketPaymentRequestDto';
import { GetPawnTicketCurrentChargesUseCase } from '../query/GetPawnTicketCurrentChargesUseCase';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';


export class PayPawnTicketUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase
    ) { }

    async execute(input: unknown): Promise<void> {
        const payments: PawnTicketPaymentBatchRequestDto = pawnTicketPaymentBatchRequestSchema.parse(input);
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
                // Accept initDate from input (must be provided)
                const initDate = (payment as any).initDate ? new Date((payment as any).initDate) : null;
                if (!initDate) throw new NotFoundError('initDate is required in input');
                if (isRedemption) {
                    defaultDate = now;
                    maturityDate = now;
                } else {
                    // For payment, defaultDate is 60 days from transactionDate
                    defaultDate = new Date(transactionDate.getTime() + 60 * 24 * 60 * 60 * 1000);
                    // Maturity date moves 30 days forward from the last period, counting from initDate
                    const msPerDay = 24 * 60 * 60 * 1000;
                    const daysSinceInit = Math.floor((transactionDate.getTime() - initDate.getTime()) / msPerDay);
                    const periodsElapsed = Math.floor(daysSinceInit / 30);
                    maturityDate = new Date(initDate.getTime() + (periodsElapsed + 1) * 30 * msPerDay);
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
                    clerkUserId: payment.clerkUserId,
                    typeId: isRedemption ? 8 : 7,
                    amount: payment.paymentAmount,
                    tender: payment.tender
                });
            }
        });
    }
}
