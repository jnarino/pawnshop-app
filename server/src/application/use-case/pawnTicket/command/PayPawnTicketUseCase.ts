
import { NotFoundError } from '../../../common/errors';
import { PawnTicketPaymentRequestDto, pawnTicketPaymentRequestSchema } from '../../../dto/pawnTicket/command/PawnTicketPaymentRequestDto';
import { GetPawnTicketCurrentChargesUseCase } from '../query/GetPawnTicketCurrentChargesUseCase';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { AppUserRepository } from '../../../../domains/appUser/AppUserRepository';
import { GunTransactionHistory } from '../../../../domains/gun/GunTransactionHistory';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import crypto from 'crypto';

const getEstDate = () => {
    const now = new Date();
    return new Date(now.getTime() - (5 * 60 * 60 * 1000));
};

export class PayPawnTicketUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase,
        private readonly appUserRepository: AppUserRepository
    ) { }

    async execute(input: unknown): Promise<{ gunTransferNumber?: string, receipts?: any[] } | void> {
        const validatedInput = pawnTicketPaymentRequestSchema.parse(input);
        const { items, tenders, clerkUserId, nicstn, gunNotes1, gunNotes2, gunFee } = validatedInput;

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
                // Find first tender with funds
                const tenderIndex = tenderQueue.findIndex(t => t.amount > 0);
                if (tenderIndex === -1) break;
                
                const tender = tenderQueue[tenderIndex];
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
                
                amountLeft = Math.round((amountLeft - tenderAmount) * 100) / 100;
                tender.amount = Math.round((tender.amount - tenderAmount) * 100) / 100;
            }
            if (amountLeft > 0) {
                throw new NotFoundError('Not enough tender amount to cover all payments');
            }
        }

        return await this.pawnTicketUnitOfWork.runInTransaction(async ({
            inventoryItemRepository,
            pawnTicketRepository,
            storeTransactionRepository,
            customerRepository,
            gunLogRepository,
            gunTransactionHistoryRepository,
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

            let gunTransferNumber: string | null = null;
            const receipts: any[] = [];
            const clerkUser = await this.appUserRepository.findById(clerkUserId);
            const clerkUsername = clerkUser ? clerkUser.username : 'Unknown';

            // Process each pawn ticket once
            for (const [pawnTicketId, ticketPayments] of paymentsByTicket.entries()) {
                const firstPayment = ticketPayments[0];
                
                // Validate all payments for this ticket have the same control number
                const controlNumber = firstPayment.controlNumber;
                const allSameControlNumber = ticketPayments.every((p: any) => p.controlNumber === controlNumber);
                if (!allSameControlNumber) {
                    throw new NotFoundError(`Multiple control numbers found for pawn ticket ${pawnTicketId}`);
                }

                // Fetch ticket entity
                const pawnTicket = await pawnTicketRepository.findById(pawnTicketId);
                if (!pawnTicket) {
                    throw new NotFoundError(`Pawn ticket ${pawnTicketId} not found`);
                }

                // 1. Get current charges once per ticket
                const charges = await this.getPawnTicketCurrentChargesUseCase.execute({ controlNumber });

                // 2. Calculate total payment amount for this ticket
                const totalPaymentAmount = ticketPayments.reduce((sum: number, p: any) => sum + p.paymentAmount, 0);

                const isRedemption = totalPaymentAmount >= charges.redemptionAmount;

                // Receipt Data
                const ticketItems = await inventoryItemRepository.findByPawnTicketId(pawnTicketId);
                const itemDescriptions = ticketItems.map(i => i.itemDescription || i.model || 'Unknown Item');
                
                let customer = null;
                if (pawnTicket.customerId) {
                    customer = await customerRepository.findById(pawnTicket.customerId);
                }

                const maturityDateObj = new Date(pawnTicket.maturityDate);
                const nextDueDate = new Date(maturityDateObj);
                nextDueDate.setDate(nextDueDate.getDate() + 30);
                
                receipts.push({
                    pawnTicketId,
                    controlNumber,
                    transactionType: isRedemption ? 'REDEEM' : 'PAYMENT',
                    customer,
                    items: itemDescriptions,
                    clerkUsername,
                    pawnAmount: Number(pawnTicket.amountFinanced || 0),
                    amountPaid: totalPaymentAmount,
                    originalCreatedDate: pawnTicket.createdDate.toISOString(),
                    newDate: getEstDate().toISOString(),
                    nextDueDate: nextDueDate.toISOString()
                });

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
                await pawnTicketRepository.updatePaymentFields({
                    pawnTicketId,
                    paymentAmount: totalPaymentAmount,
                    transactionDate,
                    updatedAt,
                    defaultDate,
                    maturityDate,
                    setRedeemed: isRedemption
                });

                // 5. If redemption, update inventory items to status 'U'
                if (isRedemption) {
                    await inventoryItemRepository.setStatusByPawnTicket(pawnTicketId, 'U');

                    // Check for Guns
                    const ticketItems = await inventoryItemRepository.findByPawnTicketId(pawnTicketId);
                    
                    let customer: any = null;

                    for (const item of ticketItems) {
                        const gunLog = await gunLogRepository.findByInventoryItemId(item.id);
                        if (gunLog) {
                            // Prepare customer info if not fetched
                            if (!customer) {
                                // Try to get customer from Ticket
                                // We need to fetch ticket entity to get customerId
                                const tickets = await pawnTicketRepository.listByControlNumber(controlNumber);
                                const ticket = tickets.find((t: any) => t.id === pawnTicketId);
                                if (ticket && ticket.customerId) {
                                    customer = await customerRepository.findById(ticket.customerId);
                                }
                            }

                            if (!gunTransferNumber) {
                                gunTransferNumber = await gunLogRepository.getNextGunTransferNumber();
                            }

                            // Update Gun Log
                            if (customer) {
                                gunLog.soldDate = getEstDate();
                                gunLog.soldFirstName = customer.firstName;
                                gunLog.soldMiddleName = customer.middleName ?? undefined;
                                gunLog.soldLastName = customer.lastName;
                                gunLog.soldStreetAddress = customer.streetAddress ?? undefined;
                                gunLog.soldCity = customer.city ?? undefined;
                                gunLog.soldState = customer.stateUs ?? undefined;
                                gunLog.soldZipCode = customer.zipCode ?? undefined;
                                gunLog.soldIdType = customer.idType ?? undefined;
                                gunLog.soldIdNumber = customer.idNumber ?? undefined;
                            }
                            gunLog.nicstn = nicstn;
                            gunLog.notes1 = gunNotes1 ?? gunLog.notes1;
                            gunLog.notes2 = gunNotes2 ?? gunLog.notes2;
                            gunLog.transactionNum = gunTransferNumber;
                            gunLog.origTransNum = gunTransferNumber;

                            await gunLogRepository.update(gunLog);

                            const typeId = await gunTransactionHistoryRepository.getTransactionTypeIdByCode('REDEEMED');

                            // History
                            await gunTransactionHistoryRepository.create(new GunTransactionHistory({
                                id: crypto.randomUUID(),
                                inventoryNumber: item.inventoryNumber || '',
                                inventoryItemId: item.id,
                                transactionDate: getEstDate(),
                                typeId: typeId || '00000000-0000-0000-0000-000000000000', // Fallback to avoid error if null
                                clerkUserId: clerkUserId,
                                notes: 'Redeemed from Pawn',
                                createdAt: getEstDate(),
                                updatedAt: getEstDate()
                            }));
                        }
                    }
                }

                // 6. Create a single store_transaction with all tenders for this ticket
                const tenderArray = ticketPayments.map((p: any) => p.tender);
                await storeTransactionRepository.createPayment({
                    pawnTicketId,
                    controlNumber,
                    clerkUserId,
                    typeId: isRedemption ? 8 : 7,
                    amount: totalPaymentAmount,
                    tenders: tenderArray
                });
            }

            // Handle Fee Transaction (Gun Fee)
            // If there's a gun fee provided, and we have remaining tenders.
            if (gunFee && gunFee > 0) {
                 const remainingTenders = tenderQueue.filter(t => t.amount > 0.005);
                 
                 // If tenders remain, create the fee tx
                 if (remainingTenders.length > 0) {
                     const feeTxId = crypto.randomUUID();
                     const clerkUser = await this.appUserRepository.findById(clerkUserId);
                     const clerkUsername = clerkUser ? clerkUser.username : 'Unknown';
                     
                     const feeTenders = remainingTenders.map((t, idx) => new StoreTransactionTender({
                         id: crypto.randomUUID(),
                         storeTransactionId: feeTxId,
                         sequence: idx + 1,
                         tenderTypeId: t.tenderTypeId,
                         amount: t.amount,
                         createdAt: getEstDate()
                     }));
                     
                     const totalFeeAmount = feeTenders.reduce((sum, t) => sum + t.amount, 0);

                     const feeTx = new StoreTransaction({
                        id: feeTxId,
                        customerId: null,
                        clerkUserId: clerkUserId,
                        typeId: 24, // MI
                        occurredAt: getEstDate(),
                        amount: totalFeeAmount,
                        taxSales: 0,
                        stateTax: 0,
                        taxExemptUsed: false,
                        tenderChange: 0,
                        gunProcFee: 0,
                        note: `GUN PROCESSING FEE BY ${clerkUsername.toUpperCase()}`,
                        tenders: feeTenders,
                        items: [],
                        createdAt: getEstDate(),
                        updatedAt: getEstDate()
                     });
                     
                     await storeTransactionRepository.create(feeTx, []);
                 }
            }
            
            return {
                gunTransferNumber: gunTransferNumber || undefined,
                receipts
            };
        });
    }
}
