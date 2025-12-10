import { randomUUID } from 'crypto';

import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../../domains/storeTransaction/StoreTransactionItem';

import {
    createStoreTransactionRequestSchema,
    CreateStoreTransactionRequestDto,
} from '../../../dto/storeTransaction/command/CreateStoreTransactionRequestDto';

import { StoreTransactionResponseDto } from '../../../dto/storeTransaction/query/StoreTransactionResponseDto';
import { toStoreTransactionResponseDto } from '../../../mapping/storeTransaction/storeTransactionMapper';

export class CreateStoreTransactionUseCase {
    constructor(
        private readonly storeTransactionRepository: StoreTransactionRepository
    ) { }

    async execute(input: unknown): Promise<StoreTransactionResponseDto> {
        const dto: CreateStoreTransactionRequestDto =
            createStoreTransactionRequestSchema.parse(input);

        const now = new Date();
        const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : now;

        const txId = randomUUID();

        const tenders = dto.tenders.map(
            (t, index) =>
                new StoreTransactionTender({
                    id: randomUUID(),
                    storeTransactionId: txId,
                    sequence: t.sequence ?? index + 1,
                    tenderTypeId: t.tenderTypeId,
                    amount: t.amount,
                    createdAt: now,
                })
        );

        const items = (dto.items ?? []).map(
            (i, index) =>
                new StoreTransactionItem({
                    id: randomUUID(),
                    storeTransactionId: txId,
                    sequence: i.sequence ?? index + 1,
                    inventoryItemId: i.inventoryItemId ?? null,
                    description: i.description ?? null,
                    quantity: i.quantity ?? 1,
                    lineAmount: i.lineAmount ?? null,
                    lineCost: i.lineCost ?? null,
                    taxExempt: i.taxExempt ?? null,
                    countyTaxExempt: i.countyTaxExempt ?? null,
                    returned: i.returned ?? null,
                    status: i.status ?? null,
                    createdAt: now,
                })
        );

        const tx = new StoreTransaction({
            id: txId,
            customerId: dto.customerId ?? null,
            clerkUserId: dto.clerkUserId,
            typeId: dto.typeId,
            occurredAt,
            amount: dto.amount ?? null,
            taxSales: dto.taxSales ?? null,
            stateTax: dto.stateTax ?? null,
            taxExemptUsed: dto.taxExemptUsed ?? false,
            taxExemptCertificate: dto.taxExemptCertificate ?? null,
            tenderChange: dto.tenderChange ?? null,
            gunProcFee: dto.gunProcFee ?? null,
            note: dto.note ?? null,
            tenders,
            items,
            createdAt: now,
            updatedAt: now,
        });

        const saved = await this.storeTransactionRepository.create(tx);
        return toStoreTransactionResponseDto(saved);
    }
}
