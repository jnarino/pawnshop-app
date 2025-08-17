import { ValidationError } from '../errors';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO } from '../../domain/inventory/IInventoryRepository';
import { canTransition } from '../../domain/inventory/inventoryStatusTransitions';

const NUM = (v: any) => typeof v === 'number' && !isNaN(v);
const POS_INT = (v: any) => Number.isInteger(v) && v > 0;
const NON_NEG = (v: any) => typeof v === 'number' && v >= 0;

type TypeValidator = (dto: any) => void;
const createTypeValidators: Record<string, TypeValidator> = {
  FIREARM: (dto) => { if (!dto.firearm) throw new ValidationError('firearm attributes required for FIREARM type'); },
  JEWELRY: (dto) => { if (!dto.jewelry) throw new ValidationError('jewelry attributes required for JEWELRY type'); },
};

export function registerCreateTypeValidator(type: string, fn: TypeValidator) { createTypeValidators[type] = fn; }

function baseNumericValidation(input: any) {
  if (input.quantity !== undefined && !POS_INT(input.quantity)) throw new ValidationError('quantity must be positive integer');
  if (input.amount !== undefined && !NON_NEG(input.amount)) throw new ValidationError('amount must be non-negative number');
  if (input.resale !== undefined && !NON_NEG(input.resale)) throw new ValidationError('resale must be non-negative number');
  if (input.itemReplace !== undefined && !NON_NEG(input.itemReplace)) throw new ValidationError('itemReplace must be non-negative number');
}

export function validateCreateInventoryItem(input: CreateInventoryItemDTO): CreateInventoryItemDTO {
  if (!input.type) throw new ValidationError('type is required');
  baseNumericValidation(input);
  const validator = createTypeValidators[input.type];
  if (validator) validator(input);
  return sanitizeInventoryItem(input);
}

export function validateUpdateInventoryItem(input: UpdateInventoryItemDTO & { currentStatus?: string }): UpdateInventoryItemDTO {
  baseNumericValidation(input);
  if (input.type === 'FIREARM' && input.firearm === undefined) throw new ValidationError('firearm attributes required when changing type to FIREARM');
  if (input.type === 'JEWELRY' && input.jewelry === undefined) throw new ValidationError('jewelry attributes required when changing type to JEWELRY');
  if (input.status && input.currentStatus && !canTransition(input.currentStatus as any, input.status as any)) {
    throw new ValidationError(`invalid status transition ${input.currentStatus} -> ${input.status}`);
  }
  return sanitizeInventoryItem(input);
}

export function sanitizeInventoryItem<T extends Partial<CreateInventoryItemDTO>>(item: T): T {
  const trim = (v: any) => typeof v === 'string' ? v.trim() : v;
  const out: any = { ...item };
  for (const k of Object.keys(out)) out[k] = trim(out[k]);
  return out;
}
