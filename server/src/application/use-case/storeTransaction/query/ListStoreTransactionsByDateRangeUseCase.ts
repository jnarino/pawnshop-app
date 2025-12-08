import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import {
  listStoreTransactionsByDateRangeRequestSchema,
  ListStoreTransactionsByDateRangeRequestDto,
} from '../../../dto/storeTransaction/query/ListStoreTransactionsByDateRangeRequestDto';
import { StoreTransactionResponseDto } from '../../../dto/storeTransaction/query/StoreTransactionResponseDto';
import { toStoreTransactionResponseDto } from '../../../mapping/storeTransaction/storeTransactionMapper';

/**
 * Detect whether a date string has an explicit time component.
 * Examples treated as "has time":
 *   "2025-12-02T10:00:00"
 *   "2025-12-02 10:00"
 *   "12/02/2025 09:30"
 */
function hasTimeComponent(raw: string): boolean {
  const s = raw.trim();
  // Look for "T10:" or " 10:" style patterns
  return /[T ]\d{1,2}:\d{2}/.test(s);
}

function parseBoundary(raw: string, kind: 'from' | 'to'): Date {
  const s = raw.trim();
  const d = new Date(s);

  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: "${raw}"`);
  }

  // If no explicit time, clamp to full-day bounds
  if (!hasTimeComponent(s)) {
    if (kind === 'from') {
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
  }

  return d;
}

function buildDateRange(
  dto: ListStoreTransactionsByDateRangeRequestDto
): { from: Date; to: Date } {
  const from = parseBoundary(dto.from, 'from');
  const to = parseBoundary(dto.to, 'to');

  if (from > to) {
    throw new Error('`from` date must be <= `to` date');
  }

  return { from, to };
}

export class ListStoreTransactionsByDateRangeUseCase {
  constructor(
    private readonly storeTransactionRepository: StoreTransactionRepository
  ) {}

  /**
   * List all store transactions whose occurred_at falls between
   * `from` and `to` (inclusive).
   *
   * - If only a date is provided (e.g., "12/02/2025" or "2025-12-02"),
   *   we use whole-day semantics:
   *   - from => 00:00:00.000
   *   - to   => 23:59:59.999
   *
   * - If a time is provided, we respect it.
   */
  async execute(
    rawInput: unknown
  ): Promise<StoreTransactionResponseDto[]> {
    const dto = listStoreTransactionsByDateRangeRequestSchema.parse(rawInput);
    const { from, to } = buildDateRange(dto);

    const transactions = await this.storeTransactionRepository.listByDateRange({
      from,
      to,
    });

    return transactions.map(toStoreTransactionResponseDto);
  }
}
