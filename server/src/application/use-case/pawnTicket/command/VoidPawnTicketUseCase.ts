import crypto from 'crypto';
import { z } from 'zod';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { VoidPawnTicketRequestDto, voidPawnTicketRequestSchema } from '../../../dto/pawnTicket/command/VoidPawnTicketRequestDto';
import { NotFoundError, ValidationError } from '../../../common/errors';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { GunTransactionHistory } from '../../../../domains/gun/GunTransactionHistory';

export class VoidPawnTicketUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork
    ) { }

    async execute(input: unknown): Promise<void> {
        const dto: VoidPawnTicketRequestDto = voidPawnTicketRequestSchema.parse(input);

        // Transaction Type IDs
        const TYPE_VOIDED_BUY = 4;
        const TYPE_VOIDED_PAWN = 9;
        const TENDER_CASH = 1;
        const TYPE_GUN_VOIDED = 'd06d0b32-4bbd-4859-b9da-cc4f81fdb57a';

        await this.pawnTicketUnitOfWork.runInTransaction(async ({
            pawnTicketRepository,
            inventoryItemRepository,
            storeTransactionRepository,
            gunTransactionHistoryRepository
        }) => {
            // 1. Find Pawn Ticket
            const tickets = await pawnTicketRepository.listByControlNumber(dto.controlNumber);
            if (tickets.length === 0) {
                throw new NotFoundError(`Pawn ticket with control number ${dto.controlNumber} not found`);
            }
            const ticket = tickets[0]; // Assuming unique control number

            // 2. Validate Customer
            if (ticket.customerId !== dto.customerId) {
                throw new ValidationError('Customer ID does not match the pawn ticket owner');
            }

            // 3. Check if already voided
            if (ticket.pawnStatus === 'V') {
                return; // Already voided, idempotent success
            }

            // 4. Determine Transaction Type and Amount
            let typeId: number;
            let amount: number;

            if (ticket.transactionType === 'PURCHASE') {
                typeId = TYPE_VOIDED_BUY;
                amount = ticket.purchaseTradeValue || 0;
            } else if (ticket.transactionType === 'PAWN') {
                typeId = TYPE_VOIDED_PAWN;
                amount = ticket.amountFinanced || 0;
            } else {
                throw new ValidationError(`Unknown transaction type: ${ticket.transactionType}`);
            }

            // 5. Update Pawn Ticket Status
            await pawnTicketRepository.setStatus(ticket.id, 'V');

            // 6. Update Inventory Items Status
            await inventoryItemRepository.setStatusByPawnTicket(ticket.id, 'V');

            const transactionId = crypto.randomUUID();
            const occurredAt = new Date();

            // 7. Log Gun Transactions (if applicable)
            if (ticket.items && ticket.items.length > 0) {
                for (const item of ticket.items) {
                    // Check if item is a gun (Inventory Number starts with G-)
                    if (item.inventoryNumber && item.inventoryNumber.startsWith('G-')) {
                        const gunHistory = new GunTransactionHistory({
                            id: crypto.randomUUID(),
                            inventoryNumber: item.inventoryNumber,
                            inventoryItemId: item.id,
                            transactionDate: occurredAt,
                            typeId: TYPE_GUN_VOIDED,
                            clerkUserId: dto.clerkUserId || ticket.clerkUserId,
                            notes: 'Voided Transaction',
                            createdAt: occurredAt,
                            updatedAt: occurredAt
                        });
                        await gunTransactionHistoryRepository.create(gunHistory);
                    }
                }
            }

            // 8. Create Store Transaction
            const storeTransaction = new StoreTransaction({
                id: transactionId,
                customerId: ticket.customerId,
                clerkUserId: dto.clerkUserId || null,
                typeId: typeId,
                occurredAt: occurredAt,
                amount: amount,
                note: dto.reason || 'Voided Pawn Ticket',
                taxExemptUsed: false,
                pawnTicketId: ticket.id,
                tenders: [],
                items: [],
                createdAt: occurredAt,
                updatedAt: occurredAt
            });

            // Create matching tender (Assume Cash Reversal)
            // Since Void Pawn/Buy implies getting money back, we add a positive Cash tender
            if (dto.tenders && dto.tenders.length > 0) {
                for (const [index, t] of dto.tenders.entries()) {
                    const tender = new StoreTransactionTender({
                        id: crypto.randomUUID(),
                        storeTransactionId: transactionId,
                        sequence: index + 1,
                        tenderTypeId: t.tenderTypeId,
                        amount: t.amount,
                        createdAt: occurredAt
                    });
                    storeTransaction.tenders.push(tender);
                }
            } else {
                const tender = new StoreTransactionTender({
                    id: crypto.randomUUID(),
                    storeTransactionId: transactionId,
                    sequence: 1,
                    tenderTypeId: TENDER_CASH,
                    amount: amount,
                    createdAt: occurredAt
                });
                storeTransaction.tenders.push(tender);
            }

            await storeTransactionRepository.create(storeTransaction);
        });
    }
}
