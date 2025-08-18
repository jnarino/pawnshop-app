import assert from 'assert';
import { mapRowToInventoryItem } from '../../../infrastructure/persistence/InventoryRepository';
import { test } from '../../testHarness';

test('infrastructure/persistence: mapRowToInventoryItem basic', () => {
  const row: any = {
    id: '10',
    inventoryNumber: '1000-1',
    status: 'in_inventory',
    categoryId: '1',
    brand: 'Glock',
    model: '19',
    serialNumber: 'SN123',
    color: 'Black',
    itemCondition: 'Good',
    quantity: 1,
    amount: 100,
    resale: 300,
    itemReplace: 450.75,
    binNumber: 'A1',
    ownerTag: 'OWN1',
    itemDescription: '9mm pistol',
    attributes: { caliberGauge: '9MM', finish: 'Black' },
    createdAt: '2025-08-15T12:00:00Z',
    updatedAt: '2025-08-15T12:10:00Z'
  };
  const mapped = mapRowToInventoryItem(row);
  assert.strictEqual(mapped.id, '10');
  assert.strictEqual(mapped.inventoryNumber, '1000-1');
  assert.strictEqual(mapped.attributes.caliberGauge, '9MM');
});

test('infrastructure/persistence: mapRowToInventoryItem attributes only', () => {
  const row: any = {
    id: '11',
    inventoryNumber: '1000-2',
    status: 'for_sale',
    categoryId: '5',
    quantity: 1,
    itemReplace: 1250,
    itemDescription: 'Gold ring',
    attributes: { metal: 'Gold', weight: 15.2, stones: [{ type: 'Diamond' }] },
    createdAt: '2025-08-16T10:00:00Z',
    updatedAt: '2025-08-16T10:05:00Z'
  };
  const mapped = mapRowToInventoryItem(row);
  assert.strictEqual(mapped.id, '11');
  assert.strictEqual(mapped.categoryId, '5');
  assert.strictEqual(mapped.itemReplace, 1250);
  assert.ok(Array.isArray(mapped.attributes.stones));
});
