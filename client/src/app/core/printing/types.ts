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
  customerAddress?: string;
  customerId?: string;
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
  metal?: string;
  karat?: string;
  weight?: string;
  weightUnit?: string;
  length?: string;
  serialNumber?: string;
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
