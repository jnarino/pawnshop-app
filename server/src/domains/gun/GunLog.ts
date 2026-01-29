// src/domains/gun/GunLog.ts

export interface GunLogProps {
    id: string;
    inventoryItemId: string;
    manufacturer: string;
    model: string;
    serial: string;
    caliber: string;
    action: string;
    condition: string;
    gunType: string;
    importer?: string;
    
    // Acquisition (Buyer) Info
    buyerAmount: number;
    buyerDate: Date;
    buyerFirstName: string;
    buyerMiddleName?: string;
    buyerLastName: string;
    buyerStreetAddress: string;
    buyerCity: string;
    buyerState: string;
    buyerZipCode: string;
    buyerIdType: string; // e.g. "FL DRIVERS"
    buyerIdNumber: string;
    
    // Disposition (Sold) Info - Optional for now
    soldDate?: Date;
    // ... add sold fields if needed later

    transactionNum?: string; // from user example
    voided?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class GunLog {
    readonly id: string;
    inventoryItemId: string;
    manufacturer: string;
    model: string;
    serial: string;
    caliber: string;
    action: string;
    condition: string;
    gunType: string;
    importer?: string;
    
    buyerAmount: number;
    buyerDate: Date;
    buyerFirstName: string;
    buyerMiddleName?: string;
    buyerLastName: string;
    buyerStreetAddress: string;
    buyerCity: string;
    buyerState: string;
    buyerZipCode: string;
    buyerIdType: string;
    buyerIdNumber: string;

    createdAt?: Date;
    updatedAt?: Date;

    constructor(props: GunLogProps) {
        this.id = props.id;
        this.inventoryItemId = props.inventoryItemId;
        this.manufacturer = props.manufacturer;
        this.model = props.model;
        this.serial = props.serial;
        this.caliber = props.caliber;
        this.action = props.action;
        this.condition = props.condition;
        this.gunType = props.gunType;
        this.importer = props.importer;
        this.buyerAmount = props.buyerAmount;
        this.buyerDate = props.buyerDate;
        this.buyerFirstName = props.buyerFirstName;
        this.buyerMiddleName = props.buyerMiddleName;
        this.buyerLastName = props.buyerLastName;
        this.buyerStreetAddress = props.buyerStreetAddress;
        this.buyerCity = props.buyerCity;
        this.buyerState = props.buyerState;
        this.buyerZipCode = props.buyerZipCode;
        this.buyerIdType = props.buyerIdType;
        this.buyerIdNumber = props.buyerIdNumber;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
