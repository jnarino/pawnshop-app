import { http } from './http';
import type { PawnTicketData, PawnTicketItem } from '@/app/feature/_shared/types/pawnTicket';

export interface CustomerActivePawnTicket extends PawnTicketData {
  totalOfPayments?: number;
  items: PawnTicketItem[];
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
  transactionDate: string;
  maturityDate: string;
  defaultDate: string;
  pawnStatus: string;
  itemIds: string[];
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

  getActiveByCustomer: async (customerId: string): Promise<CustomerActivePawnTicket[]> => {
    return http(`/api/pawn-ticket/customer/${customerId}/active`);
  },

  searchByControlNumber: async (
    customerId: string,
    controlNumber: string
  ): Promise<CustomerActivePawnTicket[]> => {
    return http(
      `/api/pawn-ticket/customer/${customerId}/active?controlNumber=${encodeURIComponent(controlNumber)}`
    );
  },
};