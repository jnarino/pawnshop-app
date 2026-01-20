import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../../domains/storeTransaction/StoreTransactionItem';
import { CreateStoreTransactionDto } from '../../../dto/storeTransaction/CreateStoreTransactionDto';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';

// EST is UTC-5
const getEstDate = () => {
    const now = new Date();
    return new Date(now.getTime() - (5 * 60 * 60 * 1000));
};

export class CreateStoreTransactionUseCase {
    constructor(
        private readonly storeTransactionRepository: StoreTransactionRepository,
        private readonly inventoryItemRepository: InventoryItemRepository,
        private readonly customerRepository: CustomerRepository
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
                createdAt: getEstDate()
            }));
        }

        // Calculate tax and amount only if not tax exempt
        let taxSales = 0;
        let totalAmount = subtotal;
        if (!input.taxExemptUsed) {
            const taxRate = 0.065; // 6.5% sales tax
            for (const item of items) {
                if (!item.taxExempt) {
                    taxSales += (item.lineAmount || 0) * taxRate;
                }
            }
            taxSales = Math.round(taxSales * 100) / 100;
            totalAmount = subtotal + taxSales;
        }

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
                createdAt: getEstDate()
            }));
            tenderTotal += tenderDto.amount;
        }

        const tenderChange = tenderTotal - totalAmount;

        // Ensure customerId is null if not provided or empty
        let customerId = input.customerId && input.customerId.trim() !== '' ? input.customerId : null;

        if (!customerId) {
            // No customer provided -> Lookup "CASH CUSTOMER"
            // We use findCustomer criteria. Assuming only one or we take the first.
            const cashCustomers = await this.customerRepository.findCustomer({ lastName: 'CASH CUSTOMER' });
            if (cashCustomers && cashCustomers.length > 0) {
                customerId = cashCustomers[0].id;
            }
        }

        // Construct Transaction
        const tx = new StoreTransaction({
            id: transactionId,
            customerId: customerId,
            clerkUserId: clerkUserId,
            typeId: 10, // Retail Sale
            occurredAt: getEstDate(),
            amount: totalAmount,
            taxSales: taxSales,
            stateTax: taxSales,
            taxExemptUsed: input.taxExemptUsed,
            tenderChange: tenderChange > 0 ? tenderChange : 0,
            gunProcFee: 0,
            note: input.note,
            tenders: tenders,
            items: items,
            createdAt: getEstDate(),
            updatedAt: getEstDate()
        });

        // Persist
        return this.storeTransactionRepository.create(tx, inventoryUpdates);
    }
}
