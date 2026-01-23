import crypto from 'crypto';
import { z } from 'zod';
import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { ControlNumberRepository } from '../../../../domains/controlNumber/ControlNumberRepository';
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionItem } from '../../../../domains/storeTransaction/StoreTransactionItem';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionTypeId } from '../../../../domains/storeTransaction/storeTransactionTypes';

import { NotFoundError } from '../../../common/errors';
import { CreateLayawayRequestDto, createLayawayRequestSchema } from '../../../dto/layaway/command/CreateLayawayRequestDto';
import { LayawayResponseDto } from '../../../dto/layaway/query/LayawayResponseDto';
import { toLayawayItemDto } from '../../../mapping/layaway/layawayMapper';

export class CreateLayawayUseCase {
    constructor(
        private readonly unitOfWork: LayawayUnitOfWork,
        private readonly controlNumberRepo: ControlNumberRepository,
        private readonly customerRepo: CustomerRepository
    ) { }

    async execute(input: unknown, clerkUserId: string): Promise<LayawayResponseDto> {
        const dto: CreateLayawayRequestDto = createLayawayRequestSchema.parse(input);

        // Get Control Number outside transaction (optimistic)
        const ticketnum = await this.controlNumberRepo.getNextStoreSaleControlNumber();

        // Validate Customer
        const customer = await this.customerRepo.findById(dto.customerId);
        if (!customer) {
            throw new NotFoundError(`Customer ${dto.customerId} not found`);
        }

        return await this.unitOfWork.runInTransaction(async (deps) => {
            const { layawayRepository, storeTransactionRepository, inventoryItemRepository } = deps;

            // 1. Calculations
            let totalAmount = 0;
            let totalTax = 0;
            const transactionItems: StoreTransactionItem[] = [];
            const layawayRows: LayawayAgreement[] = [];
            const transactionId = crypto.randomUUID();
            const taxRate = 0.065;

            const dateNow = new Date();
            // Calculate Default Date (Expiration) - Always 30 days after transaction
            const LAYAWAY_TERM_DAYS = 30;
            const defaultDate = new Date(dateNow);
            defaultDate.setDate(defaultDate.getDate() + LAYAWAY_TERM_DAYS);

            const inventoryItemsMap = new Map<string, any>(); // Cache inventory items

            for (const [index, itemDto] of dto.items.entries()) {
                const lineAmount = itemDto.amount * itemDto.quantity; // Assuming quantity 1 for serialized
                totalAmount += lineAmount;

                let inventoryNumber = null;
                let description = itemDto.description;
                let itemsId = null;

                // 2. Handle Inventory
                if (itemDto.inventoryItemId) {
                    const invItem = await inventoryItemRepository.findById(itemDto.inventoryItemId);
                    if (!invItem) throw new NotFoundError(`Inventory Item ${itemDto.inventoryItemId} not found`);

                    // Cache for later use
                    inventoryItemsMap.set(itemDto.inventoryItemId, invItem);

                    // Update Inventory Status
                    // Based on legacy/CSV, status 'L' = Layaway
                    invItem.status = 'L';
                    // Decrement quantity (remove from on-hand)
                    invItem.quantity = invItem.quantity - 1;
                    await inventoryItemRepository.update(invItem);

                    inventoryNumber = invItem.inventoryNumber;
                    description = invItem.itemDescription || itemDto.description;
                    itemsId = invItem.id;
                } else {
                    // Handle X-Item (No Inventory Link)
                    inventoryNumber = 'X-ITEM';
                    itemsId = '0'; // Legacy convention for non-inventory items
                }

                // Store Transaction Item
                transactionItems.push(new StoreTransactionItem({
                    id: crypto.randomUUID(),
                    storeTransactionId: transactionId,
                    sequence: index + 1,
                    inventoryItemId: itemsId === '0' ? null : itemsId, // Use null for FK if no real item
                    description: description,
                    quantity: itemDto.quantity,
                    lineAmount: lineAmount,
                    lineCost: null, // Could fetch if needed
                    taxExempt: false,
                    countyTaxExempt: false,
                    returned: false,
                    status: 'L', // Layaway
                    createdAt: dateNow
                }));

                // Tax
                totalTax += lineAmount * taxRate;
            }

            totalTax = Math.round(totalTax * 100) / 100;
            const grandTotal = totalAmount + totalTax;

            // 3. Create Store Transaction
            // Down payment is the "Tender" for this transaction?
            // Or is the Transaction Amount the full value?
            // Usually Store Transaction creates a receivable.
            // But here we just record the initial deposit probably?
            // User said: "create the store transacion with the ticketnum consecutive from sales"
            // If I record full sale amount, it impacts sales report.
            // If it's layaway, usually we record full sale but separate category.
            // And we handle payments.
            // `amount` is e.g. 359.00. `total_of_payments` 200.00. 
            // If `total_of_payments` is the down payment, then we have a balance.

            const tenders: StoreTransactionTender[] = [];
            if (dto.downPayment > 0) {
                tenders.push(new StoreTransactionTender({
                    id: crypto.randomUUID(),
                    storeTransactionId: transactionId,
                    sequence: 1,
                    tenderTypeId: 1, // Cash
                    amount: dto.downPayment,
                    createdAt: dateNow
                }));
            }

            const storeTx = new StoreTransaction({
                id: transactionId,
                customerId: dto.customerId,
                clerkUserId: clerkUserId,
                typeId: StoreTransactionTypeId.LAYAWAY_DEPOSIT,
                occurredAt: dateNow,
                amount: grandTotal, // Or just down payment? Usually transaction amount matches tender for cash accounting.
                // But for SALES accounting, it's the full amount.
                // Given 'LAYAWAY DEPOSIT' type, maybe it should only be the deposit amount?
                // But we have items attached.
                // Let's assume Amount = Grand Total for the Sale record. Tender = Deposit. Balance = Due.
                // But StoreTransaction struct has `tenderChange`.
                taxSales: totalTax,
                stateTax: totalTax,
                taxExemptUsed: false,
                tenderChange: 0,
                gunProcFee: 0,
                note: dto.note || '',
                tenders: tenders,
                items: transactionItems,
                createdAt: dateNow,
                updatedAt: dateNow
            });

            // Persist Store Transaction (ignoring inventory updates param since we did manual update above if implicit)
            // Actually StoreRepo.create takes inventory updates array.
            // Since we manually updated via inventoryItemRepository, we can pass empty array.
            await storeTransactionRepository.create(storeTx, []);

            // 4. Create Layaway Agreements (Rows)
            const layawayRowsResult: LayawayAgreement[] = [];

            for (const itemDto of dto.items) {
                // Retrieve cached inventory item
                const invItem = itemDto.inventoryItemId ? inventoryItemsMap.get(itemDto.inventoryItemId) : null;

                const agreement = new LayawayAgreement({
                    id: crypto.randomUUID(),
                    ticketnum: ticketnum,
                    clerkUserId: clerkUserId,
                    dateIn: dateNow,
                    lastUpdatedAt: dateNow,
                    amount: grandTotal, // Header value repeated
                    taxSales: totalTax,
                    stateTax: totalTax,
                    returnedAmt: 0,
                    customerId: dto.customerId,
                    note: dto.note || '',
                    status: 'Active',
                    defaultDate: defaultDate,
                    totalOfPayments: dto.downPayment, // Initial payment
                    period: LAYAWAY_TERM_DAYS,
                    extraNote: null,
                    gunProcFee: 0,
                    lastUpdatedUserId: clerkUserId,
                    inventoryNumber: invItem?.inventoryNumber || 'X-ITEM',
                    numberSold: itemDto.quantity,
                    itemAmount: itemDto.amount,
                    description: itemDto.description,
                    taxExempt: false,
                    returnSold: false,
                    itemStatus: 'L',
                    countyTaxExempt: false,
                    itemLastUpdatedUserId: clerkUserId,
                    itemsId: invItem?.id || '0',
                    createdAt: dateNow,
                    updatedAt: dateNow
                });

                const created = await layawayRepository.create(agreement);
                layawayRowsResult.push(created);
            }

            // 5. Construct Response
            // Grouping from flat rows similar to Query Use Case
            // Since all rows are identical header, take first one.
            const first = layawayRowsResult[0];
            return {
                id: first.id, // Only one ID? No, response DTO has 1 ID.
                // Is `LayawayResponseDto` representing the GROUP?
                // If response DTO has `items: []`, then `id` at root is ambiguous if rows have different IDs.
                // But usually the group is identified by ticketnum.
                // Let's use the first row's ID as representative or leave it.
                ticketnum: first.ticketnum,
                clerkUserId: first.clerkUserId,
                dateIn: first.dateIn ? first.dateIn.toISOString() : null,
                lastUpdatedAt: first.lastUpdatedAt ? first.lastUpdatedAt.toISOString() : null,
                amount: first.amount,
                taxSales: first.taxSales,
                stateTax: first.stateTax,
                returnedAmt: first.returnedAmt,
                customerId: first.customerId,
                note: first.note,
                status: first.status,
                defaultDate: first.defaultDate ? first.defaultDate.toISOString() : null,
                totalOfPayments: first.totalOfPayments,
                period: first.period,
                extraNote: first.extraNote,
                gunProcFee: first.gunProcFee,
                lastUpdatedUserId: first.lastUpdatedUserId,
                createdAt: first.createdAt.toISOString(),
                updatedAt: first.updatedAt.toISOString(),
                items: layawayRowsResult.map(toLayawayItemDto)
            };
        });
    }
}
