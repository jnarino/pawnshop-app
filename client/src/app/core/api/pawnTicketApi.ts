import { http } from './http';

export interface CreatePawnTicketPayload {
  customerId: string;
  type: 'PAWN' | 'PURCHASE';
  amountFinanced?: number;
  periodicRate?: number;
  purchaseTradeValue?: number;
  transactionDate: string;
  maturityDate?: string;
  defaultDate?: string;
  newInventoryItems: Array<{
    categoryId: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    colorId?: string;
    itemCondition?: string;
    quantity: number;
    priceAmount: number;
    resale: number;
    itemReplace: number;
    ownerMark?: string;
    itemDescription?: string;
    attributes: any;
  }>;
}

export interface PawnTicketResponse {
  id: string;
  controlNumber: string;
  // Add other fields if needed
}

export const pawnTicketApi = {
  create: async (payload: CreatePawnTicketPayload): Promise<PawnTicketResponse> => {
    return http('/api/pawn-tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
