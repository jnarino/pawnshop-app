import { InventoryCategory } from './InventoryCategory';

export interface InventoryCategoryRepository {

  /**
   * Get all root categories (those with no parent).      
   * 
   * @returns A list of root categories.
   */
  getRootCategories(): Promise<InventoryCategory[]>;

  /**
   * Get all subcategories for a given category.
   *  
   * @returns A list of subcategories for the given category.
   */
  getSubcategoriesGivenCategoryRoot(categoryId: string): Promise<InventoryCategory[]>;

  /**
   * Get brands for a given category.
   * 
   * @returns A list of brands for the given category.
   */
  getBrandsGivenCategoryRoot(categoryId: string): Promise<InventoryCategory[]>;
}