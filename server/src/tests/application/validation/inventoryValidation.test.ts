import assert from 'assert';
import { validateCreateInventoryItem, validateUpdateInventoryItem } from '../../../application/validation/inventoryValidation';
import { ValidationError } from '../../../application/errors';
import { test } from '../../testHarness';

test('validation/inventory: create requires categoryId', () => {
  assert.throws(() => validateCreateInventoryItem({} as any), (e:any)=> e instanceof ValidationError && /categoryId/.test(e.message));
});

test('validation/inventory: update rejects negative itemReplace', () => {
  assert.throws(() => validateUpdateInventoryItem({ itemReplace: -1 }), /itemReplace/);
});

test('validation/inventory: update allows partial without categoryId', () => {
  const cleaned = validateUpdateInventoryItem({ itemReplace: 10 });
  assert.strictEqual(cleaned.itemReplace, 10);
});
