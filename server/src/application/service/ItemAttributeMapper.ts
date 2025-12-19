import { InventoryCategoryRepository } from '../../domains/inventory/InventoryCategoryRepository';

/**
 * Input attributes from frontend/API (as received from user)
 */
export interface ItemAttributesInput {
  // Jewelry attributes
  metal?: string;  // UUID from item_attribute_value
  karat?: string;  // UUID from item_attribute_value
  gender?: string; // UUID from item_attribute_value
  style?: string;  // UUID from item_attribute_value
  sizeLength?: string; // UUID from item_attribute_value
  weight?: string; // Numeric value
  weightUnit?: string; // "Grams", "Ounces", etc.
  
  // Firearm attributes
  action?: string;  // UUID from item_attribute_value
  caliber?: string; // UUID from item_attribute_value
  finish?: string;  // UUID from item_attribute_value
  barrel?: string;  // UUID from item_attribute_value
  importer?: string; // UUID from item_attribute_value
  barrelLength?: string; // Numeric value
  condition?: string; // UUID from item_attribute_value
  
  // Stones (from frontend)
  stones?: Array<{
    quantity: number;
    type?: string;    // UUID
    shape?: string;   // UUID
    carat?: number;
    color?: string;   // UUID
    weight?: number;
    length?: number;
    width?: number;
    clarity?: string; // UUID
  }>;
  
  // Any other custom fields
  [key: string]: any;
}

/**
 * Result of mapping attributes
 */
export interface MappedItemData {
  attributes: Record<string, any>;
  extra: Record<string, any>;
}

/**
 * Service to map item attributes based on category type (jewelry vs firearm)
 * Following the same pattern as the migration script
 */
export class ItemAttributeMapper {
  constructor(
    private readonly categoryRepo: InventoryCategoryRepository
  ) {}

  /**
   * Map item attributes based on category
   * 
   * @param subcategoryId The subcategory ID of the item
   * @param input The raw input attributes from API
   * @returns Structured attributes and extra fields
   */
  async mapItemAttributes(
    subcategoryId: string,
    input: ItemAttributesInput
  ): Promise<MappedItemData> {
    // 1. Determine category type (jewelry vs firearm)
    const isFirearm = await this.isFirearmCategory(subcategoryId);
    
    // 2. Structure attributes and extra based on category
    if (isFirearm) {
      return this.mapFirearmAttributes(input);
    } else {
      return this.mapJewelryAttributes(input);
    }
  }

  /**
   * Determine if the category is a firearm category
   */
  private async isFirearmCategory(subcategoryId: string): Promise<boolean> {
    try {
      const category = await this.categoryRepo.getCategoryBySubcategoryId(subcategoryId);
      if (!category) return false;
      
      const name = category.name.toUpperCase();
      // Check if category name contains gun/firearm keywords
      return name.includes('GUN') || name.includes('FIREARM') || name.includes('WEAPON');
    } catch (error) {
      // Default to jewelry if category lookup fails
      return false;
    }
  }

  /**
   * Map jewelry item attributes
   * Attributes: metal, karat, gender, style, sizeLength (all UUIDs)
   * Extra: weight, weightUnit, stones array
   */
  private async mapJewelryAttributes(input: ItemAttributesInput): Promise<MappedItemData> {
    const attributes: Record<string, any> = {};
    const extra: Record<string, any> = {};

    // Define known jewelry-specific fields
    const knownJewelryFields = new Set([
      'metal', 'karat', 'gender', 'style', 'sizeLength',
      'weight', 'weightUnit', 'stones',
      // Firearm fields to exclude
      'action', 'caliber', 'finish', 'barrel', 'importer', 'barrelLength', 'condition'
    ]);

    // Map UUID-based attributes (these are already UUIDs from frontend)
    if (input.metal) attributes.metal = input.metal;
    if (input.karat) attributes.karat = input.karat;
    if (input.gender) attributes.gender = input.gender;
    if (input.style) attributes.style = input.style;
    if (input.sizeLength) attributes.sizeLength = input.sizeLength;

    // Map extra fields (non-UUID data)
    if (input.weight) extra.weight = input.weight;
    if (input.weightUnit) extra.weightUnit = input.weightUnit;
    
    // Map stones array
    if (input.stones && Array.isArray(input.stones) && input.stones.length > 0) {
      extra.stones = input.stones.map(stone => {
        const mappedStone: Record<string, any> = {};
        
        // Quantity (required)
        if (stone.quantity) mappedStone.quantity = stone.quantity;
        
        // Numeric values
        if (stone.carat) mappedStone.carat = stone.carat;
        if (stone.length) mappedStone.length = stone.length;
        if (stone.width) mappedStone.width = stone.width;
        if (stone.weight) mappedStone.weight = stone.weight;
        
        // UUID references
        if (stone.type) mappedStone.type = stone.type;
        if (stone.shape) mappedStone.shape = stone.shape;
        if (stone.color) mappedStone.color = stone.color;
        if (stone.clarity) mappedStone.clarity = stone.clarity;
        
        return mappedStone;
      });
    }

    // Pass through any other fields not in the known list
    for (const [key, value] of Object.entries(input)) {
      if (!knownJewelryFields.has(key) && value !== undefined) {
        extra[key] = value;
      }
    }

    return { attributes, extra };
  }

  /**
   * Map firearm item attributes
   * Attributes: action, caliber, finish, barrel, importer, condition (all UUIDs)
   * Extra: barrelLength
   */
  private async mapFirearmAttributes(input: ItemAttributesInput): Promise<MappedItemData> {
    const attributes: Record<string, any> = {};
    const extra: Record<string, any> = {};

    // Define known firearm-specific fields
    const knownFirearmFields = new Set([
      'action', 'caliber', 'finish', 'barrel', 'importer', 'barrelLength', 'condition',
      // Jewelry fields to exclude
      'metal', 'karat', 'gender', 'style', 'sizeLength', 'weight', 'weightUnit', 'stones'
    ]);

    // Map UUID-based attributes (these are already UUIDs from frontend)
    if (input.action) attributes.action = input.action;
    if (input.caliber) attributes.caliber = input.caliber;
    if (input.finish) attributes.finish = input.finish;
    if (input.barrel) attributes.barrel = input.barrel;
    if (input.importer) attributes.importer = input.importer;
    if (input.condition) attributes.condition = input.condition;

    // Map extra fields
    if (input.barrelLength) extra.barrelLength = input.barrelLength;

    // Pass through any other fields not in the known list
    for (const [key, value] of Object.entries(input)) {
      if (!knownFirearmFields.has(key) && value !== undefined) {
        extra[key] = value;
      }
    }

    return { attributes, extra };
  }
}
