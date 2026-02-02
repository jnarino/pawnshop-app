import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../../domains/storeTransaction/StoreTransactionItem';
import { CreateStoreTransactionDto } from '../../../dto/storeTransaction/CreateStoreTransactionDto';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { GunLogRepository, GunTransactionHistoryRepository } from '../../../../domains/gun/GunRepository';
import { GunTransactionHistory } from '../../../../domains/gun/GunTransactionHistory';
import { AppUserRepository } from '../../../../domains/appUser/AppUserRepository';
import crypto from 'crypto';

// EST is UTC-5
const getEstDate = () => {
    const now = new Date();
    return new Date(now.getTime() - (5 * 60 * 60 * 1000));
};

export class CreateStoreTransactionUseCase {
    constructor(
        private readonly storeTransactionRepository: StoreTransactionRepository,
        private readonly inventoryItemRepository: InventoryItemRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly gunLogRepository: GunLogRepository,
        private readonly gunTransactionHistoryRepository: GunTransactionHistoryRepository,
        private readonly appUserRepository: AppUserRepository
    ) { }

    async execute(input: CreateStoreTransactionDto, clerkUserId: string): Promise<StoreTransaction & { gunTransferNumber?: string }> {
        // 1. Calculate totals
        let subtotal = 0;
        const items: StoreTransactionItem[] = [];
        const inventoryUpdates: { id: string, quantity: number }[] = [];
        let gunTransferNumber: string | null = null;

        const transactionId = crypto.randomUUID();

        // Ensure customerId is null if not provided or empty
        let customerId = input.customerId && input.customerId.trim() !== '' ? input.customerId : null;
        let customer = null;

        if (!customerId) {
            // No customer provided -> Lookup "CASH CUSTOMER"
            // We use findCustomer criteria. Assuming only one or we take the first.
            const cashCustomers = await this.customerRepository.findCustomer({ lastName: 'CASH CUSTOMER' });
            if (cashCustomers && cashCustomers.length > 0) {
                customerId = cashCustomers[0].id;
                customer = cashCustomers[0];
            }
        } else {
             customer = await this.customerRepository.findById(customerId);
        }

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

                    // Check if Gun
                    const gunLog = await this.gunLogRepository.findByInventoryItemId(inventoryItemId);
                    if (gunLog) {
                        // Generate Transfer Number if not already generated for this transaction
                        if (!gunTransferNumber) {
                            gunTransferNumber = await this.gunLogRepository.getNextGunTransferNumber();
                        }

                        // Update Gun Log Sold Info
                        if (customer) {
                            gunLog.soldDate = getEstDate();
                            gunLog.soldFirstName = customer.firstName;
                            gunLog.soldMiddleName = customer.middleName ?? undefined;
                            gunLog.soldLastName = customer.lastName;
                            gunLog.soldStreetAddress = customer.streetAddress ?? undefined;
                            gunLog.soldCity = customer.city ?? undefined;
                            gunLog.soldState = customer.stateUs ?? undefined;
                            gunLog.soldZipCode = customer.zipCode ?? undefined;
                            // ID info? Customer entity has idType/idNumber? 
                            // Customer.ts has idType, idNumber, idState, idIssuer...
                            gunLog.soldIdType = customer.idType ?? undefined;
                            gunLog.soldIdNumber = customer.idNumber ?? undefined;
                        }
                        gunLog.soldAmount = itemDto.price;
                        gunLog.nicstn = input.nicstn;
                        gunLog.notes1 = input.gunNotes1 ?? input.note; // Use specific notes or fallback to general note
                        gunLog.notes2 = input.gunNotes2;
                        gunLog.transactionNum = gunTransferNumber;
                        gunLog.origTransNum = gunTransferNumber;
                        
                        await this.gunLogRepository.update(gunLog);

                        // Create Gun Transaction History
                         await this.gunTransactionHistoryRepository.create(new GunTransactionHistory({
                            id: crypto.randomUUID(),
                            inventoryNumber: inventoryItem.inventoryNumber || '',
                            inventoryItemId: inventoryItemId,
                            transactionDate: getEstDate(),
                            typeId: 'c089608b-72ba-4b99-801a-8718a48d0bd0', // Sold from Inventory
                            clerkUserId: clerkUserId,
                            notes: 'Sold from Inventory',
                            createdAt: getEstDate(),
                            updatedAt: getEstDate()
                        }));
                    }
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

        const gunFee = input.gunFee ?? input.gunProcFee ?? 0;
        
        // Tenders Distribution Logic
        const inputTenders = (input.tenders && input.tenders.length > 0)
            ? input.tenders
            : [{ tenderTypeId: 1, amount: totalAmount + gunFee }]; // Default to Cash covers both

        const feeTendersData: { tenderTypeId: number, amount: number }[] = [];
        const saleTendersData: { tenderTypeId: number, amount: number }[] = [];

        if (gunFee > 0) {
            let feeNeed = gunFee;
            // Map input tenders to a mutable list to consume
            const availableTenders = inputTenders.map(t => ({ ...t }));

            // 1. Allocate for Fee
            for (const t of availableTenders) {
                if (feeNeed <= 0) break;
                if (t.amount > 0) {
                    const take = Math.min(t.amount, feeNeed);
                    feeTendersData.push({ tenderTypeId: t.tenderTypeId, amount: take });
                    t.amount = Math.round((t.amount - take) * 100) / 100;
                    feeNeed = Math.round((feeNeed - take) * 100) / 100;
                }
            }

            // 2. Allocate remainder to Sale
            for (const t of availableTenders) {
                if (t.amount > 0) {
                    saleTendersData.push({ tenderTypeId: t.tenderTypeId, amount: t.amount });
                }
            }
        } else {
            saleTendersData.push(...inputTenders);
        }

        // Construct Sale Transaction Tenders
        const saleTenders: StoreTransactionTender[] = saleTendersData.map((t, index) => new StoreTransactionTender({
            id: crypto.randomUUID(),
            storeTransactionId: transactionId,
            sequence: index + 1,
            tenderTypeId: t.tenderTypeId,
            amount: t.amount,
            createdAt: getEstDate()
        }));

        const saleTenderTotal = saleTenders.reduce((sum, t) => sum + t.amount, 0);
        const saleChange = saleTenderTotal - totalAmount;

        // Construct Sale Transaction
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
            tenderChange: saleChange > 0 ? saleChange : 0,
            gunProcFee: 0, // Fee tracked in separate transaction
            note: input.note,
            tenders: saleTenders,
            items: items,
            createdAt: getEstDate(),
            updatedAt: getEstDate()
        });

        // Persist Sale
        const createdTx = await this.storeTransactionRepository.create(tx, inventoryUpdates);

        // Handle Gun Fee Transaction
        if (gunFee > 0) {
            const feeTxId = crypto.randomUUID();
            
            // Get Clerk Username
            const clerkUser = await this.appUserRepository.findById(clerkUserId);
            const clerkUsername = clerkUser ? clerkUser.username : 'Unknown';

            const feeTenders: StoreTransactionTender[] = feeTendersData.map((t, index) => new StoreTransactionTender({
                id: crypto.randomUUID(),
                storeTransactionId: feeTxId,
                sequence: index + 1,
                tenderTypeId: t.tenderTypeId,
                amount: t.amount,
                createdAt: getEstDate()
            }));

            const feeTx = new StoreTransaction({
                id: feeTxId,
                customerId: customerId,
                clerkUserId: clerkUserId,
                typeId: 24, // MI - CASH ADDED MAIN
                occurredAt: getEstDate(),
                amount: gunFee,
                taxSales: 0,
                stateTax: 0,
                taxExemptUsed: false,
                tenderChange: 0,
                gunProcFee: 0,
                note: `GUN PROCESSING FEE-P BY ${clerkUsername}`,
                tenders: feeTenders,
                items: [], // No items
                createdAt: getEstDate(),
                updatedAt: getEstDate()
            });

            await this.storeTransactionRepository.create(feeTx, []);
        }

        return gunTransferNumber ? { ...createdTx, gunTransferNumber } : createdTx;
    }
}
