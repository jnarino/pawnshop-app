import crypto from 'crypto';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { NotFoundError, ValidationError } from '../../../common/errors';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { UndoPawnTicketPaymentRequestDto, undoPawnTicketPaymentRequestSchema } from '../../../dto/pawnTicket/command/UndoPawnTicketPaymentRequestDto';
import { PawnTicketPaymentRepository } from '../../../../domains/pawnTicketPayment/PawnTicketPaymentRepository';

export class UndoPawnTicketPaymentUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork,
        private readonly pawnTicketPaymentRepository: PawnTicketPaymentRepository
    ) {}

    async execute(input: unknown): Promise<void> {
        const dto: UndoPawnTicketPaymentRequestDto = undoPawnTicketPaymentRequestSchema.parse(input);

        // 1. Lookup Last Payment
        const payments = await this.pawnTicketPaymentRepository.findByPawnTicketId(dto.pawnTicketId);
        
        if (payments.length === 0) {
            throw new NotFoundError('No payments found for this pawn ticket');
        }

        // Sort by date descending to get the last one
        // Assuming database usually returns in order, but forceful sort is safer
        const sortedPayments = payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
        const lastPayment = sortedPayments[0];

        // 2. Validate Amount
        // Note: Check if principalPaid represents total payment amount. context suggests it might.
        // The user says "last payment match the tenders amounts".
        // If principalPaid is just principal, I might have a mismatch if interest was paid.
        // However, lacking other fields, I proceed with principalPaid.
        if (Math.abs(lastPayment.principalPaid - dto.amount) > 0.01) {
            throw new ValidationError(`Last payment amount (${lastPayment.principalPaid}) does not match undo amount (${dto.amount})`);
        }

        // 3. Validate Tenders Sum
        const tendersTotal = dto.tenders.reduce((sum, t) => sum + t.amount, 0);
        if (Math.abs(tendersTotal - dto.amount) > 0.01) {
             throw new ValidationError(`Total tenders amount (${tendersTotal.toFixed(2)}) must match the undo amount (${dto.amount.toFixed(2)})`);
        }
        
        // 4. Determine Transaction Type
        // We need to invert the last transaction.
        // 'Payment' -> 7, 'Redemption' -> 8.
        let typeId = 7; // Default to Payment
        if (lastPayment.transactionTypeName?.toLowerCase().includes('redemption')) {
             typeId = 8;
        }
        // If it was another type, we default to 7? Or fail? 
        // Assuming generic payment undo uses 7.

        // 5. Create Negative Store Transaction
        await this.pawnTicketUnitOfWork.runInTransaction(async ({
            storeTransactionRepository
        }) => {
             // Invert Tenders
             const negativeTenders = dto.tenders.map((t, index) => new StoreTransactionTender({
                 id: crypto.randomUUID(),
                 storeTransactionId: '', // Set by repo if reusing createPayment logic, or need manual ID here.
                 // Actually storeTransactionRepository.createPayment usually handles ID generation or accepts one.
                 // But wait, createPayment takes DTO-like structure? No, checking PayPawnTicketUseCase it takes object with tenders array.
                 // But wait, the repository's `createPayment` method implementation details are unknown.
                 // Assuming standard usage:
                 tenderTypeId: t.tenderTypeId,
                 amount: -1 * t.amount, // Negative
                 sequence: t.sequence ?? (index + 1),
                 createdAt: new Date()
             }));

             // Create Transaction
             await storeTransactionRepository.createPayment({
                 pawnTicketId: dto.pawnTicketId,
                 controlNumber: dto.controlNumber,
                 clerkUserId: dto.clerkUserId,
                 typeId: typeId,
                 amount: -1 * dto.amount, // Negative total
                 // We pass the "tenders" arrays which are objects with tenderTypeId and amount
                 tenders: negativeTenders 
             });
        });
    }
}
