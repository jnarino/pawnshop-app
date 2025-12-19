import { InventoryItem } from './InventoryItem';

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
   * Later we can add search methods (by category, description, etc.)
   * once we know exactly how the UI will search items.
   */
}
