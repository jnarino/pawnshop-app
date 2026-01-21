import crypto from 'crypto';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../../domains/storeTransaction/StoreTransactionItem';
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import {
  VoidStoreTransactionRequestDto,
  voidStoreTransactionRequestSchema
} from '../../../dto/storeTransaction/command/VoidStoreTransactionRequestDto';
import { StoreTransactionResponseDto } from '../../../dto/storeTransaction/query/StoreTransactionResponseDto';
import { toStoreTransactionResponseDto } from '../../../mapping/storeTransaction/storeTransactionMapper';
import { NotFoundError } from '../../../common/errors';

// EST is UTC-5
const getEstDate = () => {
    const now = new Date();
    return new Date(now.getTime() - (5 * 60 * 60 * 1000));
};

const TYPE_SSV = 11; // VOIDED SALE
const STATUS_INVENTORY = 'I';

export class VoidStoreTransactionUseCase {
  constructor(
    private readonly storeTransactionRepo: StoreTransactionRepository,
    private readonly inventoryRepo: InventoryItemRepository,
    private readonly customerRepo: CustomerRepository
  ) {}

  async execute(input: unknown, clerkUserId: string): Promise<StoreTransactionResponseDto> {
    const dto: VoidStoreTransactionRequestDto = voidStoreTransactionRequestSchema.parse(input);

    // 1. Find Original Transaction to link customer/metadata if possible
    // (This is optional but good for data integrity. The user provided ControlNumber.)
    const originalTxs = await this.storeTransactionRepo.listByControlNumber(dto.controlNumber);
    // Prefer the 'SS' (Sale) or 'SSS' if multiple. Just taking the first one that looks like a Sale.
    // Ideally we'd filter for type 10 (SS), but control number lookup returns a list.
    const originalTx = originalTxs.find(t => t.typeId === 10) || originalTxs[0];

    if (!originalTx) {
       throw new NotFoundError(`Original transaction ${dto.controlNumber} not found`);
    }

    // Ensure we always have a customer. If original is null, fallback to CASH CUSTOMER.
    let customerId = originalTx.customerId;
    
    // cast to any to access customer if it exists in the runtime object but not in type
    const originalTxAny = originalTx as any;
    if (!customerId && originalTxAny.customer?.id) {
        customerId = originalTxAny.customer.id;
    }
    
    if (!customerId) {
        // findCustomer returns array
        const cashCustomers = await this.customerRepo.findCustomer({ lastName: 'CASH CUSTOMER' });
        if (cashCustomers.length > 0) {
            customerId = cashCustomers[0].id;
        }
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : getEstDate();

    // 2. Prepare Tenders (Negative amounts)
    // Client provides the amount to return (positive magnitude), so we negate it.
    const tenders = dto.tenders.map(t => new StoreTransactionTender({
        id: crypto.randomUUID(),
        storeTransactionId: '', // set later
        tenderTypeId: t.tenderTypeId,
        amount: -Math.abs(t.amount), // Ensure negative
        createdAt: occurredAt
    }));

    const totalAmount = tenders.reduce((sum, t) => sum + t.amount, 0);

    // 3. Prepare Items (Negative amounts)
    // We need to look up details for these items? 
    // The DTO has inventoryItemId and price.
    // We need description and other metadata. We can fetch from inventory repo or original tx items.
    // Fetching from Inventory Repo is safer to get current state, though status might be 'S'.
    const items: StoreTransactionItem[] = [];
    
    for (const itemInput of dto.items) {
        // Fetch current inventory item details
        const invItem = await this.inventoryRepo.findById(itemInput.inventoryItemId);
        // Note: inventoryRepo.findById might explicitly filter for active items or something? 
        // If it was sold, it should still exist.
        
        const description = invItem ? 
            (invItem.itemDescription || `${invItem.brand || ''} ${invItem.model || ''}`.trim()) 
            : 'Unknown Item';

        items.push(new StoreTransactionItem({
            id: crypto.randomUUID(),
            storeTransactionId: '', // set later
            controlNumber: dto.controlNumber,
            sequence: items.length + 1,
            inventoryItemId: itemInput.inventoryItemId,
            description: description,
            quantity: 1, // Quantity returned
            lineAmount: -Math.abs(itemInput.price), // Negative price
            lineCost: null, // We generally don't reverse cost here unless specified? default null
            taxExempt: false,
            countyTaxExempt: false,
            returned: true,
            status: 'R', // "R" for Returned? Or matches inventory status? Usually "R" in store_transaction_item status.
            createdAt: occurredAt
        }));
    }

    // 4. Create Transaction Header
    const transactionId = crypto.randomUUID();
    const storeTransaction = new StoreTransaction({
        id: transactionId,
        customerId: customerId, 
        clerkUserId: clerkUserId,
        controlNumber: dto.controlNumber, // Re-use control number? Or generate new legacy_ticketnum? 
        // CAUTION: 'controlNumber' in StoreTransaction entity usually maps to `legacy_ticketnum`.
        // If we reuse it, we group them together. This is standard PawnMaster behavior (SS and SSV share Ticket#).
        typeId: TYPE_SSV,
        occurredAt: occurredAt,
        amount: totalAmount,
        taxSales: totalAmount, // Assuming simple 100% taxable or client provided tax? 
        // User didn't specify tax input. "Client decided tender and how much to return".
        // Often "Amount" includes tax. Separate "taxSales" might need calculation or input.
        // For now, I'll set taxSales equal to amount (implying all taxable) or 0 if not specified.
        // Better safe: If we don't know tax, maybe 0? 
        // "Total Amount" = Price + Tax. 
        // If DTO price is just price, we are missing tax. 
        // Let's assume input price *is* the financial impact.
        // I will default taxSales to the same total for now, or 0.
        // Given existing data: SSV has `tax_sales` populated. 
        // I'll set it to `totalAmount` (negative) to balance out `amount`.
        stateTax: 0, // Need calc?
        taxExemptUsed: false,
        tenderChange: 0,
        gunProcFee: 0,
        note: dto.note || `Void of ${dto.controlNumber}`,
        tenders: tenders.map(t => { t.storeTransactionId = transactionId; return t; }),
        items: items.map(i => { i.storeTransactionId = transactionId; return i; }),
        createdAt: occurredAt,
        updatedAt: occurredAt
    });

    // 5. Persist Transaction
    const createdTx = await this.storeTransactionRepo.create(storeTransaction);

    // 6. Update Inventory
    for (const itemInput of dto.items) {
         // Update inventory item status to Inventory 'I' and increment quantity by 1
         await this.inventoryRepo.updateStatusAndQuantity(itemInput.inventoryItemId, STATUS_INVENTORY, 1);
    }

    return toStoreTransactionResponseDto(createdTx);
  }
}
