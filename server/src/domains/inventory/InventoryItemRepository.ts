import { InventoryItem } from './InventoryItem';

export type InventoryItemSearchCriteria = {
  brandId?: string;
  categoryId?: string;
  subcategoryId?: string;
  serialNumber?: string;
  model?: string;
  inventoryNumber?: string;
};

export interface InventoryItemRepository {
  create(item: InventoryItem): Promise<InventoryItem>;
  update(item: InventoryItem): Promise<InventoryItem>;
  delete(id: string): Promise<void>;

  findById(id: string): Promise<InventoryItem | null>;

  /**
   * Lookup by store-visible inventory number (unique).
   */
  findByInventoryNumber(inventoryNumber: string): Promise<InventoryItem | null>;

  /**
   * Lookup by inventory number, but only if the item is on inventory (status = 'I').
   * Used for pawn transactions to ensure item is available.
   */
  findAvailableByInventoryNumber(inventoryNumber: string): Promise<InventoryItem | null>;

  /**
   * Lookup by serial number (for firearms, electronics, etc.).
   * DB-side we will enforce uniqueness where appropriate.
   */
  findBySerialNumber(serialNumber: string): Promise<InventoryItem | null>;

  /**
   * Search inventory items by optional parameters.
   */
  findByParams(criteria: InventoryItemSearchCriteria): Promise<InventoryItem[]>;

  /**
 * Set status for all inventory items linked to a pawn ticket.
 */
  setStatusByPawnTicket(pawnTicketId: string, status: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;

  /**
   * Find multiple inventory items by their inventory numbers.
   * Returns inventory_number and item_description only.
   */
  findByInventoryNumbers(inventoryNumbers: string[]): Promise<Array<{ inventoryNumber: string; itemDescription: string | null }>>;

  /**
   * Generates the next available inventory number from app_settings.
   * Returns the raw number (e.g. "1", "2").
   */
  getNextInventoryNumber(): Promise<string>;

  updateStatusAndQuantity(id: string, status: string, quantity: number): Promise<void>;

  /**
   * Get inventory number by item ID
   */
  getInventoryNumberById(id: string): Promise<string | null>;

  /**
   * Find items linked to a pawn ticket.
   */
  findByPawnTicketId(pawnTicketId: string): Promise<InventoryItem[]>;
}
