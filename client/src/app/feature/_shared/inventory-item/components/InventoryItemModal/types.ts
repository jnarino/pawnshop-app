import type { LookupTypeStones, Stone } from './stones/types';

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
  brand?: string;
  model?: string;
  serial?: string;
  color?: LookupTypeStones;
  colorName?: string;
  amount?: string;
  quantity?: string;
  metal?: LookupTypeStones;
  karat?: LookupTypeStones;
  weight?: string;
  weightUnit?: string;
  gender?: LookupTypeStones;
  style?: LookupTypeStones;
  sizeLength?: string;
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
}

export const DEFAULT_ITEM: InventoryItemDraft = {
  type: '',
  quantity: '1',
  weightUnit: 'Grams',
  stones: []
};
