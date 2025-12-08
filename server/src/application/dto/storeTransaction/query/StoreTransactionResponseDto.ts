export interface StoreTransactionTenderResponseDto {
    id: string;
    sequence: number;
    tenderTypeId: number;
    amount: number;
    createdAt: string;
}

export interface StoreTransactionItemResponseDto {
    id: string;
    storeTransactionId: string;
    sequence: number;
    inventoryItemId: string | null;
    description: string | null;
    quantity: number;
    lineAmount: number | null;
    lineCost: number | null;
    taxExempt: boolean | null;
    countyTaxExempt: boolean | null;
    returned: boolean | null;
    status: string | null;
    createdAt: string;
}

export interface StoreTransactionResponseDto {
    id: string;

    customerId: string | null;
    clerkUserId: string | null;

    typeId: number;

    occurredAt: string;

    amount: number | null;
    taxSales: number | null;
    stateTax: number | null;
    taxExemptUsed: boolean;
    taxExemptCertificate: string | null;
    tenderChange: number | null;

    gunProcFee: number | null;

    note: string | null;

    createdAt: string;
    updatedAt: string;

    tenders: StoreTransactionTenderResponseDto[];
    items: StoreTransactionItemResponseDto[];
}
