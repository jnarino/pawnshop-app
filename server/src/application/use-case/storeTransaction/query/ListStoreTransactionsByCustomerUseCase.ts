import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransactionResponseDto } from '../../../dto/storeTransaction/query/StoreTransactionResponseDto';
import {
    listStoreTransactionsByCustomerRequestSchema,
    ListStoreTransactionsByCustomerRequestDto,
} from '../../../dto/storeTransaction/query/ListStoreTransactionsByCustomerRequestDto';
import { toStoreTransactionResponseDto } from '../../../mapping/storeTransaction/storeTransactionMapper';

export class ListStoreTransactionsByCustomerUseCase {
    constructor(
        private readonly storeTransactionRepository: StoreTransactionRepository
    ) { }

    async execute(input: unknown): Promise<StoreTransactionResponseDto[]> {
        const dto: ListStoreTransactionsByCustomerRequestDto =
            listStoreTransactionsByCustomerRequestSchema.parse(input);

        const txs = await this.storeTransactionRepository.listByCustomer(
            dto.customerId
        );

        return txs.map(toStoreTransactionResponseDto);
    }
}
