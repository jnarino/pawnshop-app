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

        return transactions.map(toStoreTransactionResponseDto);
    }
}
