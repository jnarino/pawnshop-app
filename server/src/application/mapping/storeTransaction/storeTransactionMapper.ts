import { StoreTransaction } from '../../../domains/storeTransaction/StoreTransaction';
import {
    StoreTransactionResponseDto,
    StoreTransactionItemResponseDto,
    StoreTransactionTenderResponseDto,
} from '../../dto/storeTransaction/query/StoreTransactionResponseDto';

export function toStoreTransactionResponseDto(
    tx: StoreTransaction
): StoreTransactionResponseDto {
    const tenders: StoreTransactionTenderResponseDto[] = tx.tenders.map((t) => ({
        id: t.id,
        sequence: t.sequence,
        tenderTypeId: t.tenderTypeId,
        amount: t.amount,
        createdAt: t.createdAt.toISOString(),
    }));

    const items: StoreTransactionItemResponseDto[] = tx.items.map((i) => ({
        id: i.id,
        storeTransactionId: i.storeTransactionId,
        controlNumber: i.controlNumber,
        sequence: i.sequence,
        inventoryItemId: i.inventoryItemId,
        description: i.description,
        quantity: i.quantity,
        lineAmount: i.lineAmount,
        lineCost: i.lineCost,
        taxExempt: i.taxExempt,
        countyTaxExempt: i.countyTaxExempt,
        returned: i.returned,
        status: i.status,
        createdAt: i.createdAt.toISOString(),
    }));

    const response: StoreTransactionResponseDto = {
        id: tx.id,
        customerId: tx.customerId,
        clerkUserId: tx.clerkUserId,
        controlNumber: tx.controlNumber,
        typeId: tx.typeId,
        occurredAt: tx.occurredAt.toISOString(),
        amount: tx.amount,
        taxSales: tx.taxSales,
        stateTax: tx.stateTax,
        taxExemptUsed: tx.taxExemptUsed,
        taxExemptCertificate: tx.taxExemptCertificate,
        tenderChange: tx.tenderChange,
        gunProcFee: tx.gunProcFee,
        note: tx.note,
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
        tenders,
        items,
    };

    // Add customer info if available (from queries with customer join)
    if ((tx as any).customer) {
        response.customer = (tx as any).customer;
    }

    return response;
}

/**
 * Maps database rows (with joined store_transaction_item) to StoreTransactionResponseDto
 * Groups multiple rows by transaction ID when items are present
 */
export function mapStoreTransactionRows(rows: any[]): StoreTransactionResponseDto[] {
    const txMap = new Map<string, StoreTransactionResponseDto>();

    for (const row of rows) {
        const txId = row.id;

        if (!txMap.has(txId)) {
            // First occurrence of this transaction
            txMap.set(txId, {
                id: row.id,
                customerId: row.customer_id,
                clerkUserId: row.clerk_user_id,
                controlNumber: row.legacy_ticketnum,
                typeId: row.type_id,
                typeCode: row.type_code,
                typeName: row.type_name,
                occurredAt: row.occurred_at.toISOString(),
                amount: parseFloat(row.amount),
                taxSales: row.tax_sales ? parseFloat(row.tax_sales) : null,
                stateTax: row.state_tax ? parseFloat(row.state_tax) : null,
                taxExemptUsed: row.tax_exempt_used,
                taxExemptCertificate: null,
                tenderChange: row.tender_change ? parseFloat(row.tender_change) : 0,
                gunProcFee: row.gun_proc_fee ? parseFloat(row.gun_proc_fee) : null,
                note: row.note,
                createdAt: row.created_at.toISOString(),
                updatedAt: row.updated_at.toISOString(),
                tenders: [], // TODO: populate if needed
                items: [],
            });
        }

        // Add item if present
        if (row.item_id) {
            const tx = txMap.get(txId)!;
            tx.items.push({
                id: row.item_id,
                storeTransactionId: row.item_store_transaction_id,
                controlNumber: row.item_legacy_invnum,
                sequence: row.item_sequence,
                inventoryItemId: row.item_inventory_item_id,
                description: row.item_description,
                quantity: parseFloat(row.item_quantity),
                lineAmount: parseFloat(row.item_line_amount),
                lineCost: parseFloat(row.item_line_cost),
                taxExempt: row.item_tax_exempt,
                countyTaxExempt: row.item_county_tax_exempt,
                returned: row.item_returned,
                status: row.item_status,
                createdAt: row.item_created_at.toISOString(),
            });
        }
    }

    return Array.from(txMap.values());
}
