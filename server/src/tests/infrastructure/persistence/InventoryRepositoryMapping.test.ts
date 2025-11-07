import { InventoryRepository } from '../../../infrastructure/persistence/InventoryRepository';
import { test } from '../../testHarness';
import assert from 'assert';

test('infrastructure/persistence: InventoryRepository mapping', async () => {
  const repo = new InventoryRepository();
  // ✅ Use the private method through a test helper or create a public method for testing
  const mockRow = {
    id: '123',
    inventory_number: 'TEST-001',
    status: 'I',
    category_id: 'cat-123',
    brand: 'TestBrand',
    model: 'TestModel',
    serial_number: 'SN123',
    color_id: 'color-123', // ✅ Updated to match new schema
    item_condition: 'Good',
    quantity: 1,
    price_amount: 100.00,
    resale: 150.00,
    min_resale: 120.00, // ✅ Added
    item_replace: 200.00,
    owner_mark: 'OWNER123', // ✅ Updated field name
    item_description: 'Test item',
    attributes: { test: true },
    created_at: new Date(),
    updated_at: new Date()
  };

  // ✅ Access the private method or create a test-specific public method
  const mapped = (repo as any).mapRowToInventoryItem(mockRow);

  assert.strictEqual(mapped.id, '123');
  assert.strictEqual(mapped.colorId, 'color-123'); // ✅ Updated assertion
  assert.strictEqual(mapped.ownerMark, 'OWNER123'); // ✅ Updated assertion
  assert.strictEqual(mapped.minResale, 120.00); // ✅ Added assertion
});
