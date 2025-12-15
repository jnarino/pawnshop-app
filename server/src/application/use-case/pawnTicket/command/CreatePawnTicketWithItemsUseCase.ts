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

        // Everything below happens inside ONE DB transaction
        return this.pawnTicketUnitOfWork.runInTransaction(
            async ({ inventoryItemRepository, pawnTicketRepository }) => {
                const createInventoryItemUseCase = new CreateInventoryItemUseCase(
                    inventoryItemRepository
                );
                const createPawnTicketUseCase = new CreatePawnTicketUseCase(
                    pawnTicketRepository
                );

                // 1) Create new inventory items and collect their IDs
                const allItemIds: string[] = [];
                for (const itemDto of items) {
                    const createdItem = await createInventoryItemUseCase.execute(itemDto);
                    allItemIds.push(createdItem.id);
                }

                // 2) Auto-generate tenders: always cash (tender type 1) with negative amountFinanced
                const amountFinanced = Number(pawn.amountFinanced) || 0;
                const tenders = [{
                    tenderTypeId: 1, // Cash
                    amount: -Math.abs(amountFinanced) // Always negative (cash out to customer)
                }];

                // 3) Now call the existing pawn-ticket creation use-case
                const pawnInput = {
                    ...pawn,
                    itemIds: allItemIds,
                    tenders
                };

                const pawnTicket = await createPawnTicketUseCase.execute(pawnInput);
                return pawnTicket;
            }
        );
    }
}
