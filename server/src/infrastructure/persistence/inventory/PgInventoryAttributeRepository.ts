import { Pool } from 'pg';
import { InventoryAttributeType } from '../../../domains/inventory/InventoryAttributeType';
import { InventoryAttributeValue } from '../../../domains/inventory/InventoryAttributeValue';
import { InventoryAttributeRepository } from '../../../domains/inventory/InventoryAttributeRepository';
import { loadSql } from '../../db/sqlLoader';

const sqlFindAllTypes = loadSql('queries', 'inventory/inventory_attribute_types_find_all');
const sqlFindValuesByType = loadSql('queries', 'inventory/inventory_attribute_values_by_type');
const sqlCreateValue = loadSql('commands', 'inventory/inventory_attribute_value_create');

export class PgInventoryAttributeRepository implements InventoryAttributeRepository {
  constructor(private readonly pool: Pool) {}

  async createValue(attributeValue: InventoryAttributeValue): Promise<InventoryAttributeValue> {
    const result = await this.pool.query(sqlCreateValue, [
      attributeValue.id,
      attributeValue.attributeTypeId,
      attributeValue.value
    ]);
    return this.mapValueRow(result.rows[0]);
  }

  async findAllTypes(): Promise<InventoryAttributeType[]> {
    const result = await this.pool.query(sqlFindAllTypes);
    return result.rows.map(this.mapTypeRow);
  }

  async findValuesByTypeId(attributeTypeId: string): Promise<InventoryAttributeValue[]> {
    const result = await this.pool.query(sqlFindValuesByType, [attributeTypeId]);
    return result.rows.map(this.mapValueRow);
  }

  private mapTypeRow(row: any): InventoryAttributeType {
    return new InventoryAttributeType({
      id: row.id,
      name: row.name
    });
  }

  private mapValueRow(row: any): InventoryAttributeValue {
    return new InventoryAttributeValue({
      id: row.id,
      attributeTypeId: row.attribute_type_id,
      value: row.value
    });
  }
}
