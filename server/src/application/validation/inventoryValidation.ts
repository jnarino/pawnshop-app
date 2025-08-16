import { ValidationError } from '../errors';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';

const NUM = (v: any) => typeof v === 'number' && !isNaN(v);
const POS_INT = (v: any) => Number.isInteger(v) && v > 0;
const NON_NEG = (v: any) => typeof v === 'number' && v >= 0;

export function validateCreateInventoryItem(input: CreateInventoryItemDTO): CreateInventoryItemDTO {
  if (!input.type) throw new ValidationError('type is required');
  if (input.quantity !== undefined && !POS_INT(input.quantity)) throw new ValidationError('quantity must be positive integer');
  if (input.amount !== undefined && !NON_NEG(input.amount)) throw new ValidationError('amount must be non-negative number');
  if (input.resale !== undefined && !NON_NEG(input.resale)) throw new ValidationError('resale must be non-negative number');
  if (input.itemReplace !== undefined && !NON_NEG(input.itemReplace)) throw new ValidationError('itemReplace must be non-negative number');

  if (input.type === 'FIREARM' && !input.firearm) throw new ValidationError('firearm attributes required for FIREARM type');
  if (input.type === 'JEWELRY' && !input.jewelry) throw new ValidationError('jewelry attributes required for JEWELRY type');

  return sanitizeInventoryItem(input);
}

export function validateUpdateInventoryItem(input: UpdateInventoryItemDTO): UpdateInventoryItemDTO {
  if (input.quantity !== undefined && !POS_INT(input.quantity)) throw new ValidationError('quantity must be positive integer');
  for (const f of ['amount','resale','itemReplace'] as const) {
    const v = (input as any)[f];
    if (v !== undefined && !NON_NEG(v)) throw new ValidationError(`${f} must be non-negative number`);
  }
  if (input.type === 'FIREARM' && !input.firearm) throw new ValidationError('firearm attributes required when changing type to FIREARM');
  if (input.type === 'JEWELRY' && !input.jewelry) throw new ValidationError('jewelry attributes required when changing type to JEWELRY');
  return sanitizeInventoryItem(input);
}

export function sanitizeInventoryItem<T extends Partial<CreateInventoryItemDTO>>(item: T): T {
  const trim = (v: any) => typeof v === 'string' ? v.trim() : v;
  const out: any = { ...item };
  for (const k of Object.keys(out)) out[k] = trim(out[k]);
  return out;
}
