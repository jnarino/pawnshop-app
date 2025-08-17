import { ValidationError } from '../errors';
import { config } from '../../config';

export interface PaginationInput { limit?: number; offset?: number; }
export interface Pagination { limit: number; offset: number; }

export function validatePagination(p: PaginationInput = {}): Pagination {
  const limit = p.limit ?? config.maxPageSize;
  const offset = p.offset ?? 0;
  if (limit < 1) throw new ValidationError('limit must be >=1');
  if (offset < 0) throw new ValidationError('offset must be >=0');
  if (limit > config.maxPageSize) throw new ValidationError(`limit must be <= ${config.maxPageSize}`);
  return { limit, offset };
}
