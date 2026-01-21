import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransactionResponseDto } from '../../../dto/storeTransaction/query/StoreTransactionResponseDto';
import { toStoreTransactionResponseDto } from '../../../mapping/storeTransaction/storeTransactionMapper';

export class ListStoreTransactionsByControlNumberUseCase {
    constructor(
        private readonly storeTransactionRepository: StoreTransactionRepository
    ) { }

    /**
     * List all store transactions whose occurred_at falls in the control number range.
     */
    async execute(
        rawInput: string
    ): Promise<StoreTransactionResponseDto[]> {
        const transactions = await this.storeTransactionRepository.listByControlNumber(rawInput);

        // Fix for legacy migration issue: Some transactions (e.g. original Sales) might be missing items 
        // because the migration attached them only to the linked Void/Adjustment transaction.
        // We find the transaction that has items and propagate them to the others sharing this control number.
        const txWithItems = transactions.find(t => t.items.length > 0);
        if (txWithItems) {
            for (const tx of transactions) {
                if (tx.items.length === 0) {
                    tx.items = [...txWithItems.items];
                }
            }
        }

        return transactions.map(toStoreTransactionResponseDto);
    }
}
