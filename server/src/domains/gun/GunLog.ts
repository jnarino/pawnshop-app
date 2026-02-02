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
    
    // Disposition (Sold) Info
    soldDate?: Date;
    soldFirstName?: string;
    soldMiddleName?: string;
    soldLastName?: string;
    soldStreetAddress?: string;
    soldCity?: string;
    soldState?: string;
    soldZipCode?: string;
    soldAmount?: number;
    soldIdType?: string;
    soldIdNumber?: string;
    
    nicstn?: string;

    notes1?: string;
    notes2?: string;

    transactionNum?: string;
    origTransNum?: string; // Added origTransNum

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

    // Sold Info
    soldDate?: Date;
    soldFirstName?: string;
    soldMiddleName?: string;
    soldLastName?: string;
    soldStreetAddress?: string;
    soldCity?: string;
    soldState?: string;
    soldZipCode?: string;
    soldAmount?: number;
    soldIdType?: string;
    soldIdNumber?: string;
    nicstn?: string;

    notes1?: string;
    notes2?: string;

    transactionNum?: string; // Added transactionNum
    origTransNum?: string; // Added origTransNum

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
        
        this.soldDate = props.soldDate;
        this.soldFirstName = props.soldFirstName;
        this.soldMiddleName = props.soldMiddleName;
        this.soldLastName = props.soldLastName;
        this.soldStreetAddress = props.soldStreetAddress;
        this.soldCity = props.soldCity;
        this.soldState = props.soldState;
        this.soldZipCode = props.soldZipCode;
        this.soldAmount = props.soldAmount;
        this.soldIdType = props.soldIdType;
        this.soldIdNumber = props.soldIdNumber;
        this.nicstn = props.nicstn;
        
        this.notes1 = props.notes1;
        this.notes2 = props.notes2;

        this.transactionNum = props.transactionNum;
        this.origTransNum = props.origTransNum;

        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
