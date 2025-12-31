export type PoliceReportItemDto = {
  controlNumber: string;
  itemType: string;
  itemBrand: string;
  itemDescription: string;
  itemQuantity: number;
  itemAmount: number;
  itemStatus: string;
  recordType: 'J' | 'O' | 'G';
  serial?: string;
  model?: string;
};

export type PoliceReportResponseDto = {
  id: string;
  controlNumber: string;
  
  // Store info
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storeZip: string;
  storePhone: string;
  
  // Transaction info
  transactionDate: string; // ISO format
  transactionTime: string;
  transactionType: string;
  
  // Customer info
  customerFullName: string;
  customerDob: string; // ISO format
  customerGender: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  customerPhone: string;
  customerEmployer: string;
  customerIdType: string;
  customerIdNumber: string;
  
  // Customer physical
  customerHeight: string;
  customerWeight: number;
  customerHairColor: string;
  customerEyeColor: string;
  
  // Items (array for multiple items)
  items: PoliceReportItemDto[];
  
  // Hold info
  holdDate: string; // ISO format
  holdAgency: string;
  holdCaseNumber: string;
  holdDateOut: string | null;
  holdStatus: 'ACTIVE' | 'RELEASED';
  
  // Report metadata
  reportDate: string; // ISO format
  generatedAt: string; // ISO format
  generatedBy: string;
};

export type PoliceReportsListDto = {
  totalCount: number;
  reportDate: string; // ISO format
  agency?: string;
  reports: PoliceReportResponseDto[];
};
