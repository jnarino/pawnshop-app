/**
 * PoliceReport Entity
 * Represents a police hold report generated from hold items
 */
export interface PoliceReportProps {
  id: string;
  controlNumber: string;
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storeZip: string;
  storePhone: string;
  
  transactionDate: Date;
  transactionTime: string;
  transactionType: 'P' | 'B' | 'L';
  
  // Customer info
  customerFirstName: string;
  customerMiddleName: string;
  customerLastName: string;
  customerDob: Date;
  customerGender: string;
  customerRace: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  customerPhone: string;
  customerEmployer: string;
  customerIdType: string;
  customerIdNumber: string;
  
  // Physical description
  customerHeight: string;
  customerWeight: number;
  customerHairColor: string;
  customerEyeColor: string;
  
  // Item info
  itemType: string;
  itemBrand: string;
  itemDescription: string;
  itemMetalType: string;
  itemKarat: number;
  itemWeight: number;
  itemSize: string;
  itemQuantity: number;
  itemAmount: number;
  itemStatus: string;
  recordType: 'J' | 'O' | 'G'; // Jewelry, Other, Firearms

  // Additional item/spec fields from daily export
  serialNumber?: string;
  ownerMark?: string;
  model?: string;
  subcategoryInitial?: string; // e.g., R/N/B/P/E/C
  metalColor?: string; // e.g., Y/W/T/S/B
  stoneShape?: string; // initial, e.g., R
  stoneColor?: string; // initial, e.g., C

  // Clerk / username
  username?: string;
  
  // Hold info
  holdDate: Date;
  holdAgency: string;
  holdCaseNumber: string;
  holdDateOut: Date | null;
  
  // Report metadata
  reportDate: Date;
  reportGeneratedAt: Date;
  generatedBy: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export class PoliceReport {
  readonly id: string;
  readonly controlNumber: string;
  readonly storeName: string;
  readonly storeAddress: string;
  readonly storeCity: string;
  readonly storeState: string;
  readonly storeZip: string;
  readonly storePhone: string;

  readonly transactionDate: Date;
  readonly transactionTime: string;
  readonly transactionType: 'P' | 'B' | 'L';

  readonly customerFirstName: string;
  readonly customerMiddleName: string;
  readonly customerLastName: string;
  readonly customerDob: Date;
  readonly customerGender: string;
  readonly customerRace: string;
  readonly customerAddress: string;
  readonly customerCity: string;
  readonly customerState: string;
  readonly customerZip: string;
  readonly customerPhone: string;
  readonly customerEmployer: string;
  readonly customerIdType: string;
  readonly customerIdNumber: string;

  readonly customerHeight: string;
  readonly customerWeight: number;
  readonly customerHairColor: string;
  readonly customerEyeColor: string;

  readonly itemType: string;
  readonly itemBrand: string;
  readonly itemDescription: string;
  readonly itemMetalType: string;
  readonly itemKarat: number;
  readonly itemWeight: number;
  readonly itemSize: string;
  readonly itemQuantity: number;
  readonly itemAmount: number;
  readonly itemStatus: string;
  readonly recordType: 'J' | 'O' | 'G';

  readonly serialNumber?: string;
  readonly ownerMark?: string;
  readonly model?: string;
  readonly subcategoryInitial?: string;
  readonly metalColor?: string;
  readonly stoneShape?: string;
  readonly stoneColor?: string;
  readonly username?: string;

  readonly holdDate: Date;
  readonly holdAgency: string;
  readonly holdCaseNumber: string;
  readonly holdDateOut: Date | null;

  readonly reportDate: Date;
  readonly reportGeneratedAt: Date;
  readonly generatedBy: string;

  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PoliceReportProps) {
    this.id = props.id;
    this.controlNumber = props.controlNumber;
    this.storeName = props.storeName;
    this.storeAddress = props.storeAddress;
    this.storeCity = props.storeCity;
    this.storeState = props.storeState;
    this.storeZip = props.storeZip;
    this.storePhone = props.storePhone;
    
    this.transactionDate = props.transactionDate;
    this.transactionTime = props.transactionTime;
    this.transactionType = props.transactionType;
    
    this.customerFirstName = props.customerFirstName;
    this.customerMiddleName = props.customerMiddleName;
    this.customerLastName = props.customerLastName;
    this.customerDob = props.customerDob;
    this.customerGender = props.customerGender;
    this.customerRace = props.customerRace;
    this.customerAddress = props.customerAddress;
    this.customerCity = props.customerCity;
    this.customerState = props.customerState;
    this.customerZip = props.customerZip;
    this.customerPhone = props.customerPhone;
    this.customerEmployer = props.customerEmployer;
    this.customerIdType = props.customerIdType;
    this.customerIdNumber = props.customerIdNumber;
    
    this.customerHeight = props.customerHeight;
    this.customerWeight = props.customerWeight;
    this.customerHairColor = props.customerHairColor;
    this.customerEyeColor = props.customerEyeColor;
    
    this.itemType = props.itemType;
    this.itemBrand = props.itemBrand;
    this.itemDescription = props.itemDescription;
    this.itemMetalType = props.itemMetalType;
    this.itemKarat = props.itemKarat;
    this.itemWeight = props.itemWeight;
    this.itemSize = props.itemSize;
    this.itemQuantity = props.itemQuantity;
    this.itemAmount = props.itemAmount;
    this.itemStatus = props.itemStatus;
    this.recordType = props.recordType;

    this.serialNumber = props.serialNumber;
    this.ownerMark = props.ownerMark;
    this.model = props.model;
    this.subcategoryInitial = props.subcategoryInitial;
    this.metalColor = props.metalColor;
    this.stoneShape = props.stoneShape;
    this.stoneColor = props.stoneColor;
    this.username = props.username;
    
    this.holdDate = props.holdDate;
    this.holdAgency = props.holdAgency;
    this.holdCaseNumber = props.holdCaseNumber;
    this.holdDateOut = props.holdDateOut;
    
    this.reportDate = props.reportDate;
    this.reportGeneratedAt = props.reportGeneratedAt;
    this.generatedBy = props.generatedBy;
    
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Full customer name for display
   */
  getFullCustomerName(): string {
    return `${this.customerFirstName} ${this.customerMiddleName} ${this.customerLastName}`.trim();
  }

  /**
   * Full customer address for display
   */
  getFullCustomerAddress(): string {
    return `${this.customerAddress} ${this.customerCity}, ${this.customerState} ${this.customerZip}`.trim();
  }

  /**
   * Full store address for display
   */
  getFullStoreAddress(): string {
    return `${this.storeAddress} ${this.storeCity}, ${this.storeState} ${this.storeZip}`.trim();
  }
}
