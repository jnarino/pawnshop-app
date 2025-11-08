import { ValidationError } from '../errors';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';
import { canTransition } from '../../domain/inventory/inventoryStatusTransitions';

const NUM = (v: any) => typeof v === 'number' && !isNaN(v);
const POS_INT = (v: any) => Number.isInteger(v) && v > 0;
const NON_NEG = (v: any) => typeof v === 'number' && v >= 0;

// Type-specific validators removed in new schema (attributes JSON + category drive semantics)
export function registerCreateTypeValidator(_type: string, _fn: any) { /* no-op retained for backward compat */ }

function baseNumericValidation(input: any) {
  if (input.quantity !== undefined && !POS_INT(input.quantity)) throw new ValidationError('quantity must be positive integer');
  if (input.amount !== undefined && !NON_NEG(input.amount)) throw new ValidationError('amount must be non-negative number');
  if (input.resale !== undefined && !NON_NEG(input.resale)) throw new ValidationError('resale must be non-negative number');
  if (input.itemReplace !== undefined && !NON_NEG(input.itemReplace)) throw new ValidationError('itemReplace must be non-negative number');
}

export function validateCreateInventoryItem(input: CreateInventoryItemDTO): CreateInventoryItemDTO {
  if (!input.categoryId) throw new ValidationError('categoryId required');
  baseNumericValidation(input);
  if (input.quantity === undefined) input.quantity = 1;
  if (!input.attributes) input.attributes = {};
  return sanitizeInventoryItem(input);
}

export function validateUpdateInventoryItem(input: UpdateInventoryItemDTO & { currentStatus?: string }): UpdateInventoryItemDTO {
  baseNumericValidation(input);
  if (input.status && input.currentStatus && !canTransition(input.currentStatus as any, input.status as any)) {
    throw new ValidationError(`invalid status transition ${input.currentStatus} -> ${input.status}`);
  }
  return sanitizeInventoryItem(input);
}

export function sanitizeInventoryItem<T extends Partial<CreateInventoryItemDTO>>(item: T): T {
  const trim = (v: any) => typeof v === 'string' ? v.trim() : v;
  const out: any = { ...item };
  for (const k of Object.keys(out)) if (k !== 'attributes') out[k] = trim(out[k]);
  return out;
}
