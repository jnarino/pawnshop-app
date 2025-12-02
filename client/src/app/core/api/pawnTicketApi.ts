import { http } from './http';

export interface PawnData {
  customerId: string;
  transactionType: 'PAWN' | 'PURCHASE';
  amountFinanced?: number;
  purchaseTradeValue?: number;
  transactionDate: string;
  maturityDate: string;
  defaultDate: string;
}

export interface PawnItem {
  categoryId: string;
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
  // Add other fields if needed
}

export const pawnTicketApi = {
  create: async (payload: CreatePawnTicketPayload): Promise<PawnTicketResponse> => {
    return http('/api/pawn-ticket', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
