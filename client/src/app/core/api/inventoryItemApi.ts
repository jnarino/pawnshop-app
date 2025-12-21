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

export async function getByInventoryNumber(inventoryNumber: string): Promise<InventoryItem> {
  const encoded = encodeURIComponent(inventoryNumber);
  return http(`/api/inventory-items/by-inventory-number/${encoded}`);
}
