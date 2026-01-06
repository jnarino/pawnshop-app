import { http } from './http';

export interface InventoryItem {
  id: string
  inventoryNumber: string
  serialNumber: string
  description?: string // Keeping for backward compatibility if needed
  itemDescription?: string
  categoryId?: string
  status: string
  cost?: number
  priceAmount?: number // This seems to be the cost from the JSON
  retailPrice?: number
  resale?: number
  quantity?: number
}

export const inventoryApi = {
  findAvailableItemByNumber: async (number: string): Promise<InventoryItem> => {
    return http(`/api/inventory-items/available/${encodeURIComponent(number)}`);
  }
};
