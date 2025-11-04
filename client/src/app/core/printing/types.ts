export interface PrintResult {
  success: boolean;
  error?: string;
  count?: number;
}

export interface TransactionPrintData {
  controlNumber: string;
  customerName: string;
  customerLastName: string;
  customerFirstInitial: string;
  customerFirst?: string;
  customerMiddle?: string;
  customerMiddleInitial?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerPhone?: string;
  customerEmployer?: string;
  customerIdNumber?: string;
  customerIdType?: string;
  customerIdState?: string;
  customerBirthdate?: string;
  customerSex?: string;
  customerHeight?: string;
  customerWeight?: string;
  customerEyes?: string;
  customerHair?: string;
  customerRace?: string;
  defaultDate?: string;
  maturityDate?: string;
  amountFinanced?: string;
  financeCharge?: string;
  totalOfPayments?: string;
  annualRate?: string;
  employeeInitials?: string;
  ticketType: 'PAWN' | 'PURCHASE';
  transactionDate: string;
  items: ItemPrintData[];
  financials?: {
    amountFinanced?: number;
    financeCharge?: number;
    periodicRate?: number;
    totalOfPayments?: number;
    apr?: number;
  };
}

export interface ItemPrintData {
  id: string;
  inventoryNumber: string;
  description: string;
  amount: string;
  brand?: string;
  category?: string;
  categoryLabel?: string;
  typeCode?: string;
  metal?: string;
  karat?: string;
  weight?: string;
  weightUnit?: string;
  length?: string;
  modelNumber?: string;
  serialNumber?: string;
  quantity?: number;
}

export interface ReceiptPrintData {
  controlNumber: string;
  customerName: string;
  transactionDate: string;
  ticketType: 'PAWN' | 'PURCHASE';
  items: Array<{
    description: string;
    amount: string;
  }>;
  total: string;
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
    license: string;
  };
}
