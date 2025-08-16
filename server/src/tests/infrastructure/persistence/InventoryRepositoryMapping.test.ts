import assert from 'assert';
import { mapRowToInventoryItem } from '../../../infrastructure/persistence/InventoryRepository';
import { test } from '../../testHarness';

test('infrastructure/persistence: mapRowToInventoryItem firearm', () => {
  const row: any = {
    id: '10',
    type: 'FIREARM',
    status: 'in_inventory',
    categoryId: '1',
    subcategoryId: '2',
    brand: 'Glock',
    model: '19',
    serialNumber: 'SN123',
    color: 'Black',
    itemCondition: 'Good',
    quantity: 1,
    amount: 100,
    resale: 300,
    itemReplace: 450.75,
    bin: 'A1',
    ownerTag: 'OWN1',
    itemDescription: '9mm pistol',
    firearm: { caliberGauge: '9MM', finish: 'Black' },
    jewelry: null,
    createdAt: '2025-08-15T12:00:00Z',
    updatedAt: '2025-08-15T12:10:00Z'
  };
  const mapped = mapRowToInventoryItem(row);
  assert.strictEqual(mapped.id, '10');
  assert.strictEqual(mapped.type, 'FIREARM');
  assert.ok(mapped.firearm);
  assert.strictEqual(mapped.jewelry, undefined);
});

test('infrastructure/persistence: mapRowToInventoryItem jewelry', () => {
  const row: any = {
    id: '11',
    type: 'JEWELRY',
    status: 'for_sale',
    categoryId: '5',
    subcategoryId: null,
    quantity: 1,
    itemReplace: 1250,
    itemDescription: 'Gold ring',
    firearm: null,
    jewelry: { metal: 'Gold', weight: 15.2, stones: [{ type: 'Diamond' }] },
    createdAt: '2025-08-16T10:00:00Z',
    updatedAt: '2025-08-16T10:05:00Z'
  };
  const mapped = mapRowToInventoryItem(row);
  assert.strictEqual(mapped.id, '11');
  assert.strictEqual(mapped.categoryId, '5');
  assert.strictEqual(mapped.subcategoryId, undefined);
  assert.strictEqual(mapped.itemReplace, 1250);
  assert.ok(mapped.jewelry);
  assert.strictEqual(mapped.firearm, undefined);
});
