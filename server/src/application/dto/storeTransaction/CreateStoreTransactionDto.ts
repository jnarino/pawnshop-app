
export interface CreateStoreTransactionDto {
    customerId: string | null;
    taxExemptUsed?: boolean;
    eatTax?: boolean;
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
    gunProcFee?: number;
    gunFee?: number;
    nicstn?: string;
    gunNotes1?: string;
    gunNotes2?: string;
}
