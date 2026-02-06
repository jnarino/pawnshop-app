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
  },

  findByParams: async (params: any): Promise<InventoryItem[]> => {
    const query = new URLSearchParams();
    if (params.serialNumber) query.append('serialNumber', params.serialNumber);
    if (params.modelNumber) query.append('modelNumber', params.modelNumber);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.subcategoryId) query.append('subcategoryId', params.subcategoryId);
    if (params.brandId) query.append('brandId', params.brandId);
    return http(`/api/inventory-items/findbyparam?${query.toString()}`);
  }
};
