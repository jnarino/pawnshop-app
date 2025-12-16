import {
    createPawnTicketWithItemsRequestSchema,
    CreatePawnTicketWithItemsRequestDto,
} from '../../../dto/pawnTicket/command/CreatePawnTicketWithItemsRequestDto';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { CreateInventoryItemOnPawnTicketUseCase } from '../../inventory/command/CreateInventoryItemOnPawnTicketUseCase';
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
            async ({ inventoryItemRepository, pawnTicketRepository, dbClient }) => {
                // 1) Get the next control number first (before creating anything)
                // Use appropriate sequence based on transaction type
                const transactionType = pawn.transactionType || 'PAWN';
                const controlNumberFunc = transactionType === 'PURCHASE' 
                    ? 'get_next_purchase_control_number' 
                    : 'get_next_pawn_control_number';
                    
                const controlNumberResult = await dbClient.query(`SELECT ${controlNumberFunc}() AS control_number`);
                const controlNumber: string = controlNumberResult.rows[0].control_number;

                // 2) Create inventory items with the control number
                const createInventoryItemOnPawnUseCase = new CreateInventoryItemOnPawnTicketUseCase(
                    inventoryItemRepository
                );
                
                const allItemIds: string[] = [];
                for (let i = 0; i < items.length; i++) {
                    const itemDto = items[i];
                    const itemIndex = i + 1; // 1-based index (106489-1, 106489-2, etc.)
                    const createdItem = await createInventoryItemOnPawnUseCase.execute(
                        itemDto, 
                        controlNumber, 
                        itemIndex
                    );
                    allItemIds.push(createdItem.id);
                }

                // 3) Create pawn ticket with the items
                const createPawnTicketUseCase = new CreatePawnTicketUseCase(
                    pawnTicketRepository
                );

                const amountFinanced = Number(pawn.amountFinanced) || 0;
                const tenders = [{
                    tenderTypeId: 1, // Cash
                    amount: -Math.abs(amountFinanced) // Always negative (cash out to customer)
                }];

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
