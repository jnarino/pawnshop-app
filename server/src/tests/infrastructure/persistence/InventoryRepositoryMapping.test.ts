import { InventoryRepository } from '../../../infrastructure/persistence/InventoryRepository';
import { pool } from '../../../infrastructure/db'; // ✅ Import pool
import { test } from '../../testHarness';
import assert from 'assert';

test('InventoryRepository: maps database row correctly', async () => {
  const repo = new InventoryRepository(pool); // ✅ Pass pool to constructor
  
  // Mock database row
  const mockRow = {
    id: 'test-id',
    inventory_number: 'INV-001',
    status: 'I',
    category_id: 'cat-1',
    brand: 'Test Brand',
    model: 'Test Model',
    serial_number: 'SN123',
    color_id: 'color-1',
    item_condition: 'Good',
    quantity: 1,
    price_amount: 100.00,
    resale: 150.00,
    min_resale: 120.00,
    item_replace: 200.00,
    owner_mark: 'OM123',
    item_description: 'Test item',
    attributes: { test: 'value' },
    created_at: new Date(),
    updated_at: new Date()
  };

  // Test the private mapping method by accessing it
  const mapped = (repo as any).mapRowToInventoryItem(mockRow);
  
  assert.strictEqual(mapped.id, 'test-id');
  assert.strictEqual(mapped.inventoryNumber, 'INV-001');
  assert.strictEqual(mapped.colorId, 'color-1');
  assert.strictEqual(mapped.ownerMark, 'OM123');
  assert.deepStrictEqual(mapped.attributes, { test: 'value' });
});
