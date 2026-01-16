import { Lookup } from '@/app/core/api/pawnTicketApi';
import type { Stone } from './stones/types';

export interface ScrappedItem {
  inventoryNumber?: string;
  quantity?: string;
  description?: string;
  stoneId?: string;
}

export interface InventoryItemDraft {
  id?: string;
  type: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandId?: string;
  brandName?: string;
  sub1?: string;
  brand?: Lookup;
  model?: string;
  serial?: string;
  color?: Lookup;
  colorName?: string;
  amount?: string;
  quantity?: string;
  metal?: Lookup;
  karat?: Lookup;
  weight?: string;
  weightUnit?: string;
  gender?: Lookup;
  style?: Lookup;
  sizeLength?: Lookup;
  description?: string;
  resale?: string;
  replace?: string;
  condition?: string;
  ownerNumber?: string;
  caliber?: string;
  action?: string;
  barrelLength?: string;
  capacity?: string;
  stones?: Stone[];
  // Additional fields for update operations
  status?: string;
  inventoryNumber?: string;
  itemStatus?: 'I' | 'J';
  minResale?: string;
  scrappedIntoInvItem?: ScrappedItem[];
  sourceItemId?: string;
  inventoryItem?: any;
  priceEach?: number;

}

export const DEFAULT_ITEM: InventoryItemDraft = {
  type: '',
  quantity: '1',
  weightUnit: 'Grams',
  stones: []
};
