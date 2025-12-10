import { InventoryCategory } from './InventoryCategory';

export interface InventoryCategoryRepository {
  /**
   * Insert a new category row.
   * Mostly for future admin UI – seeds come from migrations.
   */
  create(category: InventoryCategory): Promise<InventoryCategory>;

  /**
   * Returns the full category tree as a flat list.
   * UI uses parentId / path / depth to build hierarchy.
   */
  getAllAsTree(): Promise<InventoryCategory[]>;
}