
export interface CreateStoreTransactionDto {
    customerId: string | null;
    taxExemptUsed?: boolean;
    items: {
        inventoryItemId?: string;
        inventoryNumber: string;
        description: string;
        quantity: number;
        price: number;
        taxExempt?: boolean;
    }[];
    tenders: {
        tenderTypeId: number;
        amount: number;
    }[];
    note?: string;
}
