
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { NotFoundError } from '../../../common/errors';
import { PawnTicketPaymentBatchRequestDto, pawnTicketPaymentBatchRequestSchema } from '../../../dto/pawnTicket/command/PawnTicketPaymentRequestDto';
import { GetPawnTicketCurrentChargesUseCase } from '../query/GetPawnTicketCurrentChargesUseCase';

export class PayPawnTicketUseCase {
    constructor(
        private readonly pawnTicketRepository: PawnTicketRepository,
        private readonly inventoryItemRepository: InventoryItemRepository,
        private readonly storeTransactionRepository: StoreTransactionRepository,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase
    ) { }

    async execute(input: unknown): Promise<void> {
        const payments: PawnTicketPaymentBatchRequestDto = pawnTicketPaymentBatchRequestSchema.parse(input);

        for (const payment of payments) {
            // 1. Get current charges using controlNumber from DTO
            const charges = await this.getPawnTicketCurrentChargesUseCase.execute({ controlNumber: payment.controlNumber });
            // 2. Determine if payment is redemption
            const isRedemption = payment.paymentAmount >= charges.redemptionAmount;
            // 3. Update pawn_ticket total_of_payments
            await this.pawnTicketRepository.addPayment(payment.pawnTicketId, payment.paymentAmount);
            // 4. Create store_transaction (type 8: PPU for redemption, 7: PPP for payment)
            await this.storeTransactionRepository.createPayment({
                pawnTicketId: payment.pawnTicketId,
                clerkUserId: payment.clerkUserId,
                typeId: isRedemption ? 8 : 7,
                amount: payment.paymentAmount,
                tender: payment.tender
            });
            if (isRedemption) {
                // 5. Update inventory items to status 'U' (Redeemed)
                await this.inventoryItemRepository.setStatusByPawnTicket(payment.pawnTicketId, 'U');
                // 6. Update pawn_ticket status to 'U'
                await this.pawnTicketRepository.setStatus(payment.pawnTicketId, 'U');
            }
        }
    }
}
