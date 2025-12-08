export class StoreTransactionItem {
    readonly id: string;

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

    createdAt: Date;

    constructor(params: {
        id: string;
        storeTransactionId: string;
        sequence?: number;
        inventoryItemId?: string | null;

        description?: string | null;
        quantity?: number;
        lineAmount?: number | null;
        lineCost?: number | null;
        taxExempt?: boolean | null;
        countyTaxExempt?: boolean | null;
        returned?: boolean | null;
        status?: string | null;

        createdAt: Date;
    }) {
        this.id = params.id;
        this.storeTransactionId = params.storeTransactionId;
        this.sequence = params.sequence ?? 1;
        this.inventoryItemId = params.inventoryItemId ?? null;

        this.description = params.description ?? null;
        this.quantity = params.quantity ?? 1;
        this.lineAmount = params.lineAmount ?? null;
        this.lineCost = params.lineCost ?? null;
        this.taxExempt = params.taxExempt ?? null;
        this.countyTaxExempt = params.countyTaxExempt ?? null;
        this.returned = params.returned ?? null;
        this.status = params.status ?? null;

        this.createdAt = params.createdAt;
    }
}
