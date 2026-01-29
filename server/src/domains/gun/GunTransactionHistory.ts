// src/domains/gun/GunTransactionHistory.ts

export interface GunTransactionHistoryProps {
    id: string;
    inventoryNumber: string;
    inventoryItemId: string;
    transactionDate: Date;
    typeId: string;
    clerkUserId: string;
    notes: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class GunTransactionHistory {
    readonly id: string;
    inventoryNumber: string;
    inventoryItemId: string;
    transactionDate: Date;
    typeId: string;
    clerkUserId: string;
    notes: string;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(props: GunTransactionHistoryProps) {
        this.id = props.id;
        this.inventoryNumber = props.inventoryNumber;
        this.inventoryItemId = props.inventoryItemId;
        this.transactionDate = props.transactionDate;
        this.typeId = props.typeId;
        this.clerkUserId = props.clerkUserId;
        this.notes = props.notes;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
