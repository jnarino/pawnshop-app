import { http } from './http';
import type { PawnTicketData, PawnTicketItem } from '@/app/feature/_shared/types/pawnTicket';

export interface CustomerActivePawnTicket extends PawnTicketData {
  totalOfPayments?: number;
  items: PawnTicketItem[];
  currentCharges?: number;
  redemptionAmount?: number;
  periodsBehind?: number;
}

export interface PawnData {
  customerId: string;
  transactionType: 'PAWN' | 'PURCHASE';
  clerkUserId?: string;
  amountFinanced?: number;
  purchaseTradeValue?: number;
  periodicRate?: number;
  transactionDate: string;
  maturityDate: string;
  defaultDate: string;
  createdDate: string;
}

export interface PawnItem {
  inventorySubcategoryId: string;
  status: string;
  quantity: number;
  priceAmount: number;
  resale: number;
  brand?: string;
  model?: string;
  serialNumber?: string;
  itemDescription?: string;
  minResale?: number;
  itemReplace?: number;
  ownerMark?: string;
  colorId?: string;
  itemCondition?: string;
  extra?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export interface CreatePawnTicketPayload {
  pawn: Partial<PawnData>;
  items: Partial<PawnItem>[];
}

export interface PawnTicketResponse {
  id: string;
  controlNumber: string;
}

export interface TicketByControlNumber {
  id: string;
  controlNumber: string;
  transactionType: 'PAWN' | 'PURCHASE';
  customerId: string;
  amountFinanced: number | null;
  purchaseTradeValue: number | null;
  createdDate: string;
  transactionDate: string;
  maturityDate: string;
  defaultDate: string;
  pawnStatus: string;
  itemIds: string[];
  customer?: {
    firstName: string;
    lastName: string;
  };
  items: InventoryItem[];
  currentCharges?: number;
  redemptionAmount?: number;
  apr?: number;
  originalPawnAmount?: number;
  periodicRate?: number;
  clerkUserName?: string;
}

export interface HistoryTicket {
  id: string;
  controlNumber: string;
  dateOut: string;
  dateIn: string;
  status: string;
  amount: number;
  amountPaid: number;
  items: HistoryItem[];
}

export interface HistoryItem {
  id: string;
  description: string;
  amountEach: number;
  quantity: number;
}

export type Lookup = {
  id: string;
  name: string;
};

export type Stone = {
  type: Lookup | null;
  color: Lookup | null;
  shape: Lookup | null;
  width?: number;
  quantity?: number;
  [key: string]: unknown;
};

export type Extra = {
  stones?: Stone[];
  [key: string]: unknown;
};

export type Attributes = {
  karat?: Lookup;
  metal?: Lookup;
  style?: Lookup;
  gender?: Lookup;
  sizeLength?: Lookup;
  [key: string]: unknown;
};

export type InventoryItem = {
  id: string;

  inventorySubcategory: Lookup;
  inventoryCategory: Lookup;
  status: string;
  quantity: number;

  brand?: Lookup;
  model: string | null;
  serialNumber: string | null;
  colorId?: Lookup;
  itemCondition: string | null;
  ownerMark: string | null;
  itemDescription: string | null;

  priceAmount: number | null;
  resale: number | null;
  minResale: number | null;
  itemReplace: number | null;

  extra: Extra;
  attributes: Attributes;

  legacyInventoryNumber: string | null;
  legacyItemGuid: string | null;
  legacyCategoryDescription: string | null;
  legacyBrandColorDescription: string | null;

  inventoryNumber: string | null;
  lastUpdatedUserId: string | null;

  createdAt: string | null;
  updatedAt: string;
};


export interface PawnTicketCharges {
  pawnTicketId: string;
  currentCharges: number;
  pawnAmount: number;
  periodsBehind: number;
  redemptionAmount: number;
}

export const pawnTicketApi = {

  create: async (payload: CreatePawnTicketPayload): Promise<PawnTicketResponse> => {
    return http('/api/pawn-ticket', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  findByControlNumber: async (controlNumber: string): Promise<TicketByControlNumber[]> => {
    return http(`/api/pawn-ticket/control/${encodeURIComponent(controlNumber)}`);
  },

  getByCustomer: async (customerId: string): Promise<CustomerActivePawnTicket[]> => {
    return http(`/api/pawn-ticket/customer/${customerId}`);
  },

  getPreviousItemsByCustomer: async (customerId: string): Promise<PawnTicketItem[]> => {
    return http(`/api/pawn-ticket/customer/${customerId}/previous-items`);
  },

  getActiveByCustomer: async (customerId: string): Promise<CustomerActivePawnTicket[]> => {
    return http(`/api/pawn-ticket/customer/${customerId}/active`);
  },

  pullToInventory: async (payload: any): Promise<{ id: string; inventoryNumber: string }[]> => {
    return http(`/api/pawn-ticket/pull-to-inventory`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  searchByControlNumber: async (
    _customerId: string,
    controlNumber: string
  ): Promise<CustomerActivePawnTicket[]> => {
    return http(
      `/api/pawn-ticket/control/${encodeURIComponent(controlNumber)}`
    );
  },

  findByDateRange: async (from: string, to: string): Promise<TicketByControlNumber[]> => {
    return http(`/api/pawn-ticket/date-range?from=${from}&to=${to}`);
  },

  getAllTicketsByCustomer: async (customerId: string): Promise<HistoryTicket[]> => {
    return http(`/api/pawn-ticket/customer/${customerId}/history`);
  },

  voidPawn: async (payload: any): Promise<void> => {
    return http(`/api/pawn-ticket/void`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};