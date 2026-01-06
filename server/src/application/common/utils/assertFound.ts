import { NotFoundError } from '../errors';

/**
 * Utility to enforce presence of a value. Throws NotFoundError with provided message when value is null/undefined.
 * Keeps controller code thin and centralizes 404 behavior for reuse across use cases.
 */
export function assertFound<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
  return value;
}
