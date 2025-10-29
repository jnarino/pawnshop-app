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
    priceAmount?: number;
    resale?: number;
    itemReplace?: number;
    ownerMark?: string;
    itemDescription?: string;
    attributes?: Record<string, any>;
}

export interface CreatePawnTicketDto {
    controlNumber?: string;
    type: PawnTicketType;
    customerId: string;

    // Either provide existing inventory items OR new ones
    inventoryItemIds?: string[];
    newInventoryItems?: NewInventoryItemDto[];

    // Pawn-specific inputs
    amountFinanced?: number;
    periodicRate?: number;

    // Purchase-specific input
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
