import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../../domains/storeTransaction/StoreTransactionItem';
import { CreateStoreTransactionDto } from '../../../../application/dto/storeTransaction/CreateStoreTransactionDto';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';

export class CreateStoreTransaction {
    constructor(
        private readonly storeTransactionRepository: StoreTransactionRepository,
        private readonly inventoryItemRepository: InventoryItemRepository
    ) { }

    async execute(input: CreateStoreTransactionDto, clerkUserId: string): Promise<StoreTransaction> {
        // 1. Calculate totals
        let subtotal = 0;
        const items: StoreTransactionItem[] = [];
        const inventoryUpdates: { id: string, quantity: number }[] = [];

        const transactionId = crypto.randomUUID();

        for (const [index, itemDto] of input.items.entries()) {
            const lineAmount = itemDto.quantity * itemDto.price;
            subtotal += lineAmount;

            let inventoryItemId: string | null = null;
            let cost = 0;

            if (itemDto.inventoryItemId) {
                const inventoryItem = await this.inventoryItemRepository.findById(itemDto.inventoryItemId);
                if (inventoryItem) {
                    inventoryItemId = inventoryItem.id;
                    if (inventoryItem.priceAmount) {
                        cost = Number(inventoryItem.priceAmount) * itemDto.quantity;
                    }

                    inventoryUpdates.push({
                        id: inventoryItem.id,
                        quantity: itemDto.quantity
                    });
                }
            }

            items.push(new StoreTransactionItem({
                id: crypto.randomUUID(),
                storeTransactionId: transactionId,
                sequence: index + 1,
                inventoryItemId: inventoryItemId,
                description: itemDto.description,
                quantity: itemDto.quantity,
                lineAmount: lineAmount,
                lineCost: cost > 0 ? cost : null, // If no inventory item, no cost tracked for now
                taxExempt: itemDto.taxExempt ?? false,
                countyTaxExempt: false, // Default
                returned: false,
                status: 'S', // Sold
                createdAt: new Date()
            }));
        }

        const taxRate = 0.07;
        let taxSales = 0;

        for (const item of items) {
            if (!item.taxExempt) {
                taxSales += (item.lineAmount || 0) * taxRate;
            }
        }

        // Round tax
        taxSales = Math.round(taxSales * 100) / 100;
        const totalAmount = subtotal + taxSales;

        // Tenders
        const tenders: StoreTransactionTender[] = [];
        let tenderTotal = 0;

        // Validation: If no tenders, force CASH for total (Assumption from plan)
        const finalTenders = (input.tenders && input.tenders.length > 0)
            ? input.tenders
            : [{ tenderTypeId: 1, amount: totalAmount }]; // Default to Cash

        for (const [index, tenderDto] of finalTenders.entries()) {
            tenders.push(new StoreTransactionTender({
                id: crypto.randomUUID(),
                storeTransactionId: transactionId,
                sequence: index + 1,
                tenderTypeId: tenderDto.tenderTypeId,
                amount: tenderDto.amount,
                createdAt: new Date()
            }));
            tenderTotal += tenderDto.amount;
        }

        const tenderChange = tenderTotal - totalAmount;

        // Construct Transaction
        const tx = new StoreTransaction({
            id: transactionId,
            customerId: input.customerId,
            clerkUserId: clerkUserId,
            typeId: 10, // Retail Sale
            occurredAt: new Date(),
            amount: totalAmount,
            taxSales: taxSales,
            stateTax: taxSales,
            taxExemptUsed: input.taxExemptUsed,
            tenderChange: tenderChange > 0 ? tenderChange : 0,
            gunProcFee: 0,
            note: input.note,
            tenders: tenders,
            items: items,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Persist
        return this.storeTransactionRepository.create(tx, inventoryUpdates);
    }
}
