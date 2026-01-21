import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { StoreTransactionResponseDto } from '../../../dto/storeTransaction/query/StoreTransactionResponseDto';
import {
    listStoreTransactionsByCustomerRequestSchema,
    ListStoreTransactionsByCustomerRequestDto,
} from '../../../dto/storeTransaction/query/ListStoreTransactionsByCustomerRequestDto';
import { toStoreTransactionResponseDto } from '../../../mapping/storeTransaction/storeTransactionMapper';

export class ListStoreTransactionsByCustomerUseCase {
    constructor(
        private readonly storeTransactionRepository: StoreTransactionRepository,
        private readonly inventoryItemRepository: InventoryItemRepository
    ) { }

    async execute(input: unknown): Promise<StoreTransactionResponseDto[]> {
        const dto: ListStoreTransactionsByCustomerRequestDto =
            listStoreTransactionsByCustomerRequestSchema.parse(input);

        const txs = await this.storeTransactionRepository.listByCustomer(
            dto.customerId
        );

        const dtos = txs.map(toStoreTransactionResponseDto);

        // Enrich items with inventory number
        for (const dto of dtos) {
            for (const item of dto.items) {
                if (item.inventoryItemId) {
                    const inventoryNumber = await this.inventoryItemRepository.getInventoryNumberById(item.inventoryItemId);
                    if (inventoryNumber) {
                        item.inventoryNumber = inventoryNumber;
                    }
                }
            }
        }

        return dtos;
    }
}

