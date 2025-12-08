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

    return {
        id: tx.id,
        customerId: tx.customerId,
        clerkUserId: tx.clerkUserId,
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
}
