import { InventoryAttributeType } from './InventoryAttributeType';
import { InventoryAttributeValue } from './InventoryAttributeValue';

export interface InventoryAttributeRepository {
  /**
   * Get all attribute types (HAIR, COLOR, RACE, etc.)
   */
  findAllTypes(): Promise<InventoryAttributeType[]>;

  /**
   * Get all attribute values for a specific type ID
   */
  findValuesByTypeId(attributeTypeId: string): Promise<InventoryAttributeValue[]>;

  /**
   * Create a new attribute value
   */
  createValue(attributeValue: InventoryAttributeValue): Promise<InventoryAttributeValue>;
}
