import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import {
  listBalanceCashDrawerRequestSchema,
  ListBalanceCashDrawerRequestDto,
  CashDrawerBalanceResponseDto,
  MainDrawerBalance
} from '../../../dto/storeTransaction/query/CashDrawerBalanceDto';
import { ValidationError } from '../../../common/errors';

// All 8 tender types in order
const TENDER_TYPES = [
  { id: 1, name: 'CASH' },
  { id: 2, name: 'AMERICAN EXPRESS' },
  { id: 3, name: 'DEBIT' },
  { id: 4, name: 'DISCOVER' },
  { id: 5, name: 'MASTER CARD' },
  { id: 6, name: 'VISA' },
  { id: 7, name: 'CHECK' },
  { id: 8, name: 'CASH PASS' }
];

export class ListBalanceCashDrawerUseCase {
  constructor(private readonly storeTransactionRepository: StoreTransactionRepository) {}

  async execute(input: unknown): Promise<CashDrawerBalanceResponseDto> {
    const _dto: ListBalanceCashDrawerRequestDto = listBalanceCashDrawerRequestSchema.parse(input);

    // Get last close and activity since close
    const lastClose = await this.storeTransactionRepository.getLastClose();
    const activity = await this.storeTransactionRepository.getActivitySinceClose();

    if (lastClose && activity.length === 0) {
      throw new ValidationError('There are no more transactions after the last close.');
    }

    // Build map of tender totals
    const tenderTotals = new Map<number, number>();
    for (const tender of TENDER_TYPES) {
      tenderTotals.set(tender.id, 0);
    }

    // Sum activity by tender type
    for (const row of activity) {
      if (row.tenderTypeId) {
        const current = tenderTotals.get(row.tenderTypeId) || 0;
        tenderTotals.set(row.tenderTypeId, current + row.amount);
      }
    }

    // Calculate balances
    const lastCloseBalance = lastClose?.amount ?? 0;
    const cashActivitySinceClose = tenderTotals.get(1) ?? 0;
    const currentBalance = lastCloseBalance + cashActivitySinceClose;

    // Build mainDrawerBalance object with all tender types
    const mainDrawerBalance: MainDrawerBalance = {
      'CASH': currentBalance,
      'AMERICAN EXPRESS': tenderTotals.get(2) ?? 0,
      'DEBIT': tenderTotals.get(3) ?? 0,
      'DISCOVER': tenderTotals.get(4) ?? 0,
      'MASTER CARD': tenderTotals.get(5) ?? 0,
      'VISA': tenderTotals.get(6) ?? 0,
      'CHECK': tenderTotals.get(7) ?? 0,
      'CASH PASS': tenderTotals.get(8) ?? 0
    };

    return {
      lastCloseOccurredAt: lastClose?.occurredAt.toISOString() ?? null,
      lastCloseBalance,
      currentBalance,
      mainDrawerBalance,
      asOf: new Date().toISOString()
    };
  }
}
