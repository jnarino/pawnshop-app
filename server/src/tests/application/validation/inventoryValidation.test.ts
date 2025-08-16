import assert from 'assert';
import { validateCreateInventoryItem, validateUpdateInventoryItem } from '../../../application/validation/inventoryValidation';
import { ValidationError } from '../../../application/errors';
import { test } from '../../testHarness';

test('validation/inventory: create requires type', () => {
  assert.throws(() => validateCreateInventoryItem({} as any), (e:any)=> e instanceof ValidationError && /type/.test(e.message));
});

test('validation/inventory: create FIREARM requires firearm attrs', () => {
  assert.throws(() => validateCreateInventoryItem({ type:'FIREARM', quantity:1 } as any), /firearm/i);
});

test('validation/inventory: create JEWELRY requires jewelry attrs', () => {
  assert.throws(() => validateCreateInventoryItem({ type:'JEWELRY', quantity:1 } as any), /jewelry/i);
});

test('validation/inventory: update rejects negative itemReplace', () => {
  assert.throws(() => validateUpdateInventoryItem({ itemReplace: -1 }), /itemReplace/);
});

test('validation/inventory: update FIREARM requires firearm attrs when switching type', () => {
  assert.throws(() => validateUpdateInventoryItem({ type:'FIREARM' } as any), /firearm/i);
});
