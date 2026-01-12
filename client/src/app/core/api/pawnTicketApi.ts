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
  karat?: Lookup | null;
  metal?: Lookup | null;
  style?: Lookup | null;
  gender?: Lookup | null;
  sizeLength?: Lookup | null;
  [key: string]: unknown;
};

export type InventoryItem = {
  id: string;

  inventorySubcategory: Lookup;
  inventoryCategory: Lookup;
  status: string;
  quantity: number;

  brand: Lookup | null;
  model: string | null;
  serialNumber: string | null;
  colorId: Lookup | null;
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
    // return http(`/api/pawn-ticket/customer/${customerId}/previous-items`);

    // Mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'item-1',
            status: 'B',
            quantity: 1,
            priceAmount: 200,
            resale: 400,
            itemDescription: 'Gold Necklace 24k',
            inventoryCategory: { id: 'cat-1', name: 'Jewelry' },
            inventorySubcategory: { id: 'sub-1', name: 'Necklaces' },
            brand: { id: 'brand-1', name: 'Generic' },
            model: 'Vintage',
            serialNumber: 'VN123456',
            extra: { stones: [] },
            attributes: { metal: { id: 'Gold', name: 'Gold' }, karat: { id: '24k', name: '24k' } }
          },
          {
            id: 'item-2',
            status: 'P',
            quantity: 1,
            priceAmount: 500,
            resale: 1000,
            itemDescription: 'Gibson Les Paul Guitar',
            inventoryCategory: { id: 'cat-2', name: 'Musical Instruments' },
            inventorySubcategory: { id: 'sub-2', name: 'Guitars' },
            brand: { id: 'brand-2', name: 'Gibson' },
            model: 'Les Paul Standard',
            serialNumber: 'LP2023001',
            extra: {},
            attributes: {}
          }
        ]);
      }, 500);
    });
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

  getAllTicketsByCustomer: async (customerId: string): Promise<TicketByControlNumber[]> => {
    // return http(`/api/pawn-ticket/customer/${customerId}/history`);

    // Mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'hist-ticket-1',
            controlNumber: '888100',
            transactionType: 'PAWN',
            customerId: customerId,
            amountFinanced: 500,
            purchaseTradeValue: 0,
            transactionDate: '2023-01-15T10:00:00Z',
            maturityDate: '2023-02-14T10:00:00Z',
            defaultDate: '2023-03-16T10:00:00Z',
            pawnStatus: 'Redeemed',
            itemIds: ['item-h1'],
            currentCharges: 0,
            redemptionAmount: 0,
            items: [
              {
                id: 'item-h1', // Unique ID
                status: 'P',
                quantity: 1,
                priceAmount: 500,
                resale: 1000,
                itemDescription: 'Diamond Ring 18k',
                inventoryCategory: { id: 'cat-1', name: 'Jewelry' },
                inventorySubcategory: { id: 'sub-1', name: 'Rings' },
                brand: { id: 'brand-1', name: 'Tiffany & Co.' },
                model: 'Solitaire',
                serialNumber: 'TIF123',
                extra: {},
                attributes: { metal: { id: 'Gold', name: 'Gold' }, karat: { id: '18k', name: '18k' } }
              } as any
            ]
          },
          {
            id: 'hist-ticket-2',
            controlNumber: '888101',
            transactionType: 'PAWN',
            customerId: customerId,
            amountFinanced: 250,
            purchaseTradeValue: 0,
            transactionDate: '2023-02-01T14:30:00Z',
            maturityDate: '2023-03-03T14:30:00Z',
            defaultDate: '2023-04-02T14:30:00Z',
            pawnStatus: 'Active',
            itemIds: ['item-h2'],
            currentCharges: 25,
            redemptionAmount: 275,
            items: [
              {
                id: 'item-h2',
                status: 'P',
                quantity: 1,
                priceAmount: 250,
                resale: 500,
                itemDescription: 'Sony PlayStation 5',
                inventoryCategory: { id: 'cat-3', name: 'Electronics' },
                inventorySubcategory: { id: 'sub-3', name: 'Consoles' },
                brand: { id: 'brand-3', name: 'Sony' },
                model: 'PS5 Disc Edition',
                serialNumber: 'S01-456789',
                extra: {},
                attributes: {}
              } as any
            ]
          },
          {
            id: 'hist-ticket-3',
            controlNumber: '888102',
            transactionType: 'PAWN',
            customerId: customerId,
            amountFinanced: 1200,
            purchaseTradeValue: 0,
            transactionDate: '2023-03-10T09:15:00Z',
            maturityDate: '2023-04-09T09:15:00Z',
            defaultDate: '2023-05-09T09:15:00Z',
            pawnStatus: 'Forfeited',
            itemIds: ['item-h3'],
            currentCharges: 0,
            redemptionAmount: 0,
            items: [
              {
                id: 'item-h3',
                status: 'B', // Inventory
                quantity: 1,
                priceAmount: 1200,
                resale: 2400,
                itemDescription: 'Rolex Submariner',
                inventoryCategory: { id: 'cat-1', name: 'Jewelry' },
                inventorySubcategory: { id: 'sub-4', name: 'Watches' },
                brand: { id: 'brand-4', name: 'Rolex' },
                model: 'Submariner Date',
                serialNumber: 'R888999',
                extra: {},
                attributes: {}
              } as any
            ]
          }
        ]);
      }, 500);
    });
  },
};