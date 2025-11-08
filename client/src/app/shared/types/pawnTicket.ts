export type PawnTicketType = 'PAWN' | 'PURCHASE';
export type PawnStatus = 'active' | 'defaulted' | 'police hold' | 'confiscation';

export interface NewInventoryItemDto {
    categoryId: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    color?: string;
    itemCondition?: string;
    quantity?: number;
    priceAmount?: number;        // Amount loaned/paid
    resale?: number;             // Expected resale
    minResale?: number;          // Minimum resale (floor)
    itemReplace?: number;        // Replacement cost
    ownerMark?: string;
    itemDescription?: string;
    attributes?: Record<string, any>;
}

export interface CreatePawnTicketDto {
    type: 'PAWN' | 'PURCHASE';
    customerId: string;
    controlNumber?: string;

    // For new inventory items
    newInventoryItems?: Array<{
        categoryId: string;
        brand?: string;
        model?: string;
        serialNumber?: string;
        colorId?: string | null; // ✅ Allow null
        itemCondition?: string;
        quantity?: number;
        priceAmount?: number;
        ownerMark?: string;
        itemDescription?: string;
        attributes?: Record<string, any>;
    }>;

    // For existing inventory items
    inventoryItemIds?: string[];

    // ✅ PAWN-specific fields
    amountFinanced?: number;
    periodicRate?: number;

    // ✅ PURCHASE-specific fields  
    purchaseTradeValue?: number;

    // Optional overrides
    transactionDate?: string;
    maturityDate?: string;
    defaultDate?: string;
}

export interface PawnTicketDto {
    id: string;
    controlNumber?: string;
    type: PawnTicketType;
    customerId: string;
    pawnStatus: PawnStatus;
    inventoryItemIds: string[];

    // Financials
    amountFinanced: number | null;
    financeCharge: number | null;
    periodicRate: number | null;
    totalOfPayments: number | null;
    annualPercentageRate: number | null;
    purchaseTradeValue: number | null;

    // Dates
    transactionDate: string;
    maturityDate: string;
    defaultDate: string;

    createdAt: string;
    updatedAt: string;
}
