import {
    createPawnTicketWithItemsRequestSchema,
    CreatePawnTicketWithItemsRequestDto,
} from '../../../dto/pawnTicket/command/CreatePawnTicketWithItemsRequestDto';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { CreateInventoryItemUseCase } from '../../inventory/command/CreateInventoryItemUseCase';
import { CreatePawnTicketUseCase } from './CreatePawnTicketUseCase';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

export class CreatePawnTicketWithItemsUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto> {
        const parsed: CreatePawnTicketWithItemsRequestDto =
            createPawnTicketWithItemsRequestSchema.parse(input);

        const pawn = parsed.pawn;
        const items = parsed.items;
        const itemIdsFromPayload = parsed.itemIds;

        // Start with any existing item IDs that came in the payload
        const allItemIds: string[] = [];
        if (Array.isArray(itemIdsFromPayload)) {
            allItemIds.push(...itemIdsFromPayload);
        }

        // Everything below happens inside ONE DB transaction
        return this.pawnTicketUnitOfWork.runInTransaction(
            async ({ inventoryItemRepository, pawnTicketRepository }) => {
                const createInventoryItemUseCase = new CreateInventoryItemUseCase(
                    inventoryItemRepository
                );
                const createPawnTicketUseCase = new CreatePawnTicketUseCase(
                    pawnTicketRepository
                );

                // 1) Create new inventory items (if any) and add their IDs
                if (Array.isArray(items) && items.length > 0) {
                    for (const itemDto of items) {
                        const createdItem = await createInventoryItemUseCase.execute(itemDto);
                        allItemIds.push(createdItem.id);
                    }
                }

                if (allItemIds.length === 0) {
                    throw new Error('Pawn ticket must have at least one linked item');
                }

                // 2) Now call the existing pawn-ticket creation use-case
                const pawnInput = {
                    ...pawn,
                    itemIds: allItemIds,
                };

                const pawnTicket = await createPawnTicketUseCase.execute(pawnInput);
                return pawnTicket;
            }
        );
    }
}
