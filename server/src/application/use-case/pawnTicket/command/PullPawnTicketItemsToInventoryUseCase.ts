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

            // 1) Fetch the pawn ticket
            const ticket = await pawnTicketRepository.findById(dto.pawnTicketId);
            if (!ticket) throw new NotFoundError(`Pawn ticket not found: ${dto.pawnTicketId}`);

            // 2) Determine status based on typeTicket
            // PAWN → 'D' (Defaulted), PURCHASE → 'I' (Inventory/Purchase)
            const statusCode = dto.typeTicket === 'PAWN' ? 'D' : 'I';

            // 3) Set pawn ticket status, transaction_date, and default_marked_by in one call
            await pawnTicketRepository.setStatusByCode(
                dto.pawnTicketId,
                statusCode,
                dto.typeTicket,
                dto.transactionDate,
                dto.clerkUserId
            );

            // 4) Update each item
            for (const it of dto.items) {
                const item = await inventoryItemRepository.findById(it.id);
                if (!item) throw new NotFoundError(`Inventory item not found: ${it.id}`);

                // Determine item status based only on scrappedIntoInvItem array
                // If array is empty → 'I', if array has data → 'J'
                const finalStatus = it.scrappedIntoInvItem && it.scrappedIntoInvItem.length > 0 ? 'J' : 'I';

                // Compute resale/minResale
                const resale = typeof it.resale === 'number' ? it.resale : item.resale ?? item.priceAmount ?? 0;
                const minResale = typeof it.minResale === 'number'
                    ? it.minResale
                    : Math.round(((item.priceAmount ?? resale) * (1 - DEFAULT_MIN_RESALE_DISCOUNT)) * 100) / 100;

                // Apply updates to original item
                item.status = finalStatus;
                item.quantity = item.quantity; // Keep original quantity
                item.resale = resale;
                item.minResale = minResale;
                item.createdAt = new Date();
                item.updatedAt = new Date();
                await inventoryItemRepository.update(item);

                // Collect non-scrapped items to return their inventory numbers
                if (finalStatus !== 'J') {
                    responseItems.push({ id: item.id, inventoryNumber: item.inventoryNumber ?? null });
                }

                // If scrapped into other inventory items, increment each target's quantity
                if (it.scrappedIntoInvItem && it.scrappedIntoInvItem.length > 0) {
                    for (const scrapTarget of it.scrappedIntoInvItem) {
                        const target = await inventoryItemRepository.findByInventoryNumber(scrapTarget.inventoryNumber);
                        if (!target) throw new NotFoundError(`Scrap target inventory_number not found: ${scrapTarget.inventoryNumber}`);
                        target.quantity = (target.quantity ?? 0) + scrapTarget.quantity;
                        target.updatedAt = new Date();
                        await inventoryItemRepository.update(target);
                    }
                }
            }

            return responseItems;
        });
    }
}
