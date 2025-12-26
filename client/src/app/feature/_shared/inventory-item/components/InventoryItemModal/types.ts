import type { Stone } from './stones/types';

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
  color?: string;
  amount?: string;
  quantity?: string;
  metal?: string;
  karat?: string;
  weight?: string;
  weightUnit?: string;
  gender?: string;
  style?: string;
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
}

export const DEFAULT_ITEM: InventoryItemDraft = {
  type: '',
  quantity: '1',
  weightUnit: 'Grams',
  stones: []
};
