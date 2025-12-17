import { http } from './http';

export interface InventoryItem {
  id: string
  inventoryNumber: string
  serialNumber: string
  description: string
  categoryId: string
  status: string
  cost: number
  retailPrice: number
}

export const inventoryApi = {
  findAvailableItemByNumber: async (number: string): Promise<InventoryItem> => {
    return http(`/api/inventory-items/available/${encodeURIComponent(number)}`);
  }
};
