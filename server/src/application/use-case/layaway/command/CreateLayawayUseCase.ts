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
        const controlNumber = await this.controlNumberRepo.getNextStoreSaleControlNumber();

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
            const transactionId = crypto.randomUUID();
            const taxRate = 0.065; // Fixed 6.5% tax for now

            const dateNow = new Date();
            // Calculate Default Date (Expiration) - Always 30 days after transaction
            const LAYAWAY_TERM_DAYS = 30;
            const defaultDate = new Date(dateNow);
            defaultDate.setDate(defaultDate.getDate() + LAYAWAY_TERM_DAYS);

            const inventoryItemsMap = new Map<string, any>(); // Cache inventory items

            for (const [index, itemDto] of dto.items.entries()) {
                const lineAmount = itemDto.price * itemDto.quantity; // Price from new DTO
                totalAmount += lineAmount;

                let inventoryNumber = null;
                let description = itemDto.description;
                let itemsId = null;

                // 2. Handle Inventory (Obligatory)
                const invItem = await inventoryItemRepository.findById(itemDto.inventoryItemId);
                if (!invItem) throw new NotFoundError(`Inventory Item ${itemDto.inventoryItemId} not found`);

                // Cache for later use
                inventoryItemsMap.set(itemDto.inventoryItemId, invItem);

                // Update Inventory Status
                // Based on legacy/CSV, status 'L' = Layaway
                invItem.status = 'L';
                // Decrement quantity
                invItem.quantity = invItem.quantity - 1;
                await inventoryItemRepository.update(invItem);

                inventoryNumber = invItem.inventoryNumber;
                description = invItem.itemDescription || itemDto.description;
                itemsId = invItem.id;

                // Store Transaction Item
                transactionItems.push(new StoreTransactionItem({
                    id: crypto.randomUUID(),
                    storeTransactionId: transactionId,
                    sequence: index + 1,
                    inventoryItemId: itemsId,
                    description: description,
                    quantity: itemDto.quantity,
                    lineAmount: lineAmount,
                    lineCost: null,
                    taxExempt: dto.taxExemptUsed,
                    countyTaxExempt: false,
                    returned: false,
                    status: 'L', // Layaway
                    createdAt: dateNow
                }));

                // Tax Calculation
                if (!dto.taxExemptUsed) {
                    totalTax += lineAmount * taxRate;
                }
            }

            totalTax = Math.round(totalTax * 100) / 100;
            const grandTotal = totalAmount + totalTax;

            // Calculate Deposit from Tenders
            const depositAmount = dto.tenders.reduce((sum, t) => sum + t.amount, 0);

            // 3. Create Store Transaction
            const tenders: StoreTransactionTender[] = dto.tenders.map((t, idx) => new StoreTransactionTender({
                id: crypto.randomUUID(),
                storeTransactionId: transactionId,
                sequence: idx + 1,
                tenderTypeId: t.tenderTypeId,
                amount: t.amount,
                createdAt: dateNow
            }));

            const storeTx = new StoreTransaction({
                id: transactionId,
                customerId: dto.customerId,
                clerkUserId: clerkUserId,
                typeId: StoreTransactionTypeId.LAYAWAY_DEPOSIT,
                occurredAt: dateNow,
                amount: grandTotal,
                taxSales: totalTax,
                stateTax: totalTax,
                taxExemptUsed: dto.taxExemptUsed,
                tenderChange: 0,
                gunProcFee: 0,
                note: dto.note || '',
                tenders: tenders,
                items: transactionItems,
                createdAt: dateNow,
                updatedAt: dateNow
            });

            // Persist Store Transaction
            await storeTransactionRepository.create(storeTx, []);

            // 4. Create Layaway Agreements (Rows)
            const layawayRowsResult: LayawayAgreement[] = [];

            for (const itemDto of dto.items) {
                // Retrieve cached inventory item
                const invItem = inventoryItemsMap.get(itemDto.inventoryItemId);

                const agreement = new LayawayAgreement({
                    id: crypto.randomUUID(),
                    ticketnum: controlNumber,
                    clerkUserId: clerkUserId,
                    dateIn: dateNow,
                    lastUpdatedAt: dateNow,
                    amount: grandTotal, // Header value repeated
                    taxSales: totalTax,
                    stateTax: totalTax,
                    returnedAmt: 0,
                    customerId: dto.customerId,
                    customerFirstName: customer.firstName,
                    customerLastName: customer.lastName,
                    note: dto.note || '',
                    status: 'Active',
                    defaultDate: defaultDate,
                    totalOfPayments: depositAmount, // Initial payment sum
                    period: LAYAWAY_TERM_DAYS,
                    extraNote: null,
                    gunProcFee: 0,
                    lastUpdatedUserId: clerkUserId,
                    inventoryNumber: invItem.inventoryNumber,
                    numberSold: itemDto.quantity,
                    itemAmount: itemDto.price, // Item Price
                    description: itemDto.description,
                    taxExempt: dto.taxExemptUsed,
                    returnSold: false,
                    itemStatus: 'L',
                    countyTaxExempt: false,
                    itemLastUpdatedUserId: clerkUserId,
                    itemsId: invItem.id,

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
                controlNumber: first.ticketnum,
                clerkUserId: first.clerkUserId,
                occurredAt: first.dateIn ? first.dateIn.toISOString() : null,
                lastUpdatedAt: first.lastUpdatedAt ? first.lastUpdatedAt.toISOString() : null,
                amount: first.amount,
                taxSales: first.taxSales,
                stateTax: first.stateTax,
                returnedAmt: first.returnedAmt,
                customer: {
                    id: first.customerId,
                    firstName: first.customerFirstName ?? null,
                    middleName: first.customerMiddleName ?? null,
                    lastName: first.customerLastName ?? null,
                    dateOfBirth: first.customerDateOfBirth ? first.customerDateOfBirth.toISOString() : null,
                    phoneNumber: first.customerPhoneNumber ?? null,
                    cellPhone: first.customerCellPhone ?? null,
                    email: first.customerEmail ?? null,
                },
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
