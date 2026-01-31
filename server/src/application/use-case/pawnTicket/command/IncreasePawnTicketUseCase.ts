import crypto from 'crypto';
import { IncreasePawnTicketRequestDto, increasePawnTicketRequestSchema } from '../../../dto/pawnTicket/command/IncreasePawnTicketRequestDto';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { NotFoundError, ValidationError } from '../../../common/errors';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';

export class IncreasePawnTicketUseCase {
    constructor(private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork) {}

    async execute(input: unknown): Promise<void> {
        const dto: IncreasePawnTicketRequestDto = increasePawnTicketRequestSchema.parse(input);

        await this.pawnTicketUnitOfWork.runInTransaction(async ({
            pawnTicketRepository,
            inventoryItemRepository,
            storeTransactionRepository,
        }) => {
            // 1. Fetch Pawn Ticket
            const pawnTicket = await pawnTicketRepository.findById(dto.id);
            if (!pawnTicket) {
                throw new NotFoundError('Pawn Ticket not found');
            }

            // 2. Calculate Difference
            const currentAmount = Number(pawnTicket.amountFinanced) || 0;
            const newAmount = dto.amountFinanced;

            if (newAmount <= currentAmount) {
                 throw new ValidationError(`New amount financed must be greater than current amount (${currentAmount})`);
            }
            const difference = newAmount - currentAmount;

            // 3. Update Pawn Ticket Amount
            await pawnTicketRepository.updateAmount(dto.id, newAmount);

            // 4. Update Inventory Items Prices
            for (const itemDto of dto.items) {
                const item = await inventoryItemRepository.findById(itemDto.id);
                 if (item) {
                     item.priceAmount = itemDto.priceAmount;
                     await inventoryItemRepository.update(item);
                 }
            }

            // 5. Create Store Transaction
            const txId = crypto.randomUUID();
            const transaction = new StoreTransaction({
                id: txId,
                typeId: 5, // PAWN (loan cash out)
                occurredAt: new Date(),
                customerId: dto.customerId,
                clerkUserId: dto.clerkUserId,
                amount: difference, 
                pawnTicketId: dto.id,
                controlNumber: pawnTicket.controlNumber, // Linking control number
                // Default fields
                taxSales: 0,
                stateTax: 0,
                taxExemptUsed: false,
                taxExemptCertificate: null,
                tenderChange: 0,
                gunProcFee: 0,
                note: 'Increase Pawn Ticket Amount',
                items: [], // No store transaction items, just financial tx
                tenders: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            // Add Cash tender
            transaction.tenders = [
                new StoreTransactionTender({
                    id: crypto.randomUUID(),
                    storeTransactionId: txId,
                    tenderTypeId: 1, // CASH
                    amount: difference,
                    sequence: 1,
                    createdAt: new Date()
                })
            ];

            await storeTransactionRepository.create(transaction);
        });
    }
}
