import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { pullPawnTicketItemsToInventoryRequestSchema, PullPawnTicketItemsToInventoryRequestDto } from '../../../dto/pawnTicket/command/PullPawnTicketItemsToInventoryRequestDto';
import { PullPawnTicketItemsToInventoryResponseDto } from '../../../dto/pawnTicket/command/PullPawnTicketItemsToInventoryResponseDto';
import { NotFoundError } from '../../../common/errors';

const DEFAULT_MIN_RESALE_DISCOUNT = 0.2; // 20% discount when minResale not provided

export class PullPawnTicketItemsToInventoryUseCase {
    constructor(private readonly uow: PawnTicketUnitOfWork) { }

    async execute(input: unknown): Promise<PullPawnTicketItemsToInventoryResponseDto> {
        const dto: PullPawnTicketItemsToInventoryRequestDto = pullPawnTicketItemsToInventoryRequestSchema.parse(input);

        return await this.uow.runInTransaction(async ({ pawnTicketRepository, inventoryItemRepository }) => {
            const responseItems: PullPawnTicketItemsToInventoryResponseDto = [];

            // 1) Update ticket status and markings
            const statusCode = dto.ticketStatus;
            await pawnTicketRepository.setStatus(dto.pawnTicketId, statusCode);
            await pawnTicketRepository.updateMarkings({
                pawnTicketId: dto.pawnTicketId,
                transactionDate: dto.transactionDate,
                defaultMarkedBy: dto.defaultMarkedBy
            });

            // 2) Update each item
            for (const it of dto.items) {
                const item = await inventoryItemRepository.findById(it.id);
                if (!item) throw new NotFoundError(`Inventory item not found: ${it.id}`);

                // Determine status (override to 'J' if scrappedIntoInvItem provided)
                const finalStatus = it.scrappedIntoInvItem ? 'J' : it.itemStatus;

                // Compute resale/minResale
                const resale = typeof it.resale === 'number' ? it.resale : item.resale ?? item.priceAmount ?? 0;
                const minResale = typeof it.minResale === 'number'
                    ? it.minResale
                    : Math.round(((item.priceAmount ?? resale) * (1 - DEFAULT_MIN_RESALE_DISCOUNT)) * 100) / 100;

                // Apply updates to original item
                item.status = finalStatus;
                item.quantity = it.quantity;
                item.resale = resale;
                item.minResale = minResale;
                item.createdAt = new Date();
                item.updatedAt = new Date();
                await inventoryItemRepository.update(item);

                // Collect non-scrapped items to return their inventory numbers
                if (finalStatus !== 'J') {
                    responseItems.push({ id: item.id, inventoryNumber: item.inventoryNumber ?? null });
                }

                // If scrapped into another inventory item, increment that item's quantity
                if (it.scrappedIntoInvItem) {
                    const target = await inventoryItemRepository.findByInventoryNumber(it.scrappedIntoInvItem);
                    if (!target) throw new NotFoundError(`Scrap target inventory_number not found: ${it.scrappedIntoInvItem}`);
                    target.quantity = (target.quantity ?? 0) + it.quantity;
                    target.updatedAt = new Date();
                    await inventoryItemRepository.update(target);
                }
            }

            return responseItems;
        });
    }
}
