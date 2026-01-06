import { http } from './http';

export interface InventoryItem {
  id: string;
  inventoryNumber: string;
  type: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandId?: string;
  brandName?: string;
  model?: string;
  serial?: string;
  description?: string;
  condition?: string;
  cost?: number;
  retailPrice?: number;
  weight?: number;
  metalType?: string;
  purity?: string;
  ringSize?: string;
  stones?: unknown[];
  caliber?: string;
  action?: string;
  barrelLength?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItemApiResponse {
  id: string;
  inventoryNumber?: string;
  inventorySubcategory?: { id: string; name: string };
  inventoryCategory?: { id: string; name: string };
  status?: string;
  quantity?: number;
  brand?: { id: string; name: string } | null;
  model?: string | null;
  serialNumber?: string | null;
  colorId?: string | null;
  itemCondition?: string | null;
  ownerMark?: string | null;
  itemDescription?: string | null;
  priceAmount?: number | null;
  resale?: number | null;
  minResale?: number | null;
  itemReplace?: number | null;
  extra?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export interface UpdateInventoryItemPayload {
  id: string;
  inventorySubcategoryId?: string;
  status?: string;
  quantity?: number;
  brand?: string;
  model?: string;
  serialNumber?: string;
  colorId?: string;
  itemCondition?: string;
  ownerMark?: string;
  itemDescription?: string;
  priceAmount?: number;
  resale?: number;
  minResale?: number;
  itemReplace?: number;
  extra?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  inventoryNumber?: string;
}

export async function getByInventoryNumber(inventoryNumber: string): Promise<InventoryItemApiResponse> {
  const encoded = encodeURIComponent(inventoryNumber);
  return http(`/api/inventory-items/by-inventory-number/${encoded}`);
}

export async function createInventoryItem(payload: Omit<UpdateInventoryItemPayload, 'id'>): Promise<InventoryItemApiResponse> {
  return http('/api/inventory-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInventoryItem(id: string, payload: Omit<UpdateInventoryItemPayload, 'id'>): Promise<InventoryItemApiResponse> {
  return http(`/api/inventory-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getScrapInventoryNumbers(): Promise<{ itemDescription: string; inventoryNumber: string }[]> {
  return http('/api/inventory-items/scrap-inventory-numbers');
}
