import {
    createPawnTicketWithItemsRequestSchema,
    CreatePawnTicketWithItemsRequestDto,
} from '../../../dto/pawnTicket/command/CreatePawnTicketWithItemsRequestDto';
import { PawnTicketUnitOfWork } from '../../../common/PawnTicketUnitOfWork';
import { CreateInventoryItemOnPawnTicketUseCase } from '../../inventory/command/CreateInventoryItemOnPawnTicketUseCase';
import { CreatePawnTicketUseCase } from './CreatePawnTicketUseCase';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';
import { ItemAttributeMapper } from '../../../service/ItemAttributeMapper';
import { ControlNumberRepository } from '../../../../domains/controlNumber/ControlNumberRepository';

export class CreatePawnTicketWithItemsUseCase {
    constructor(
        private readonly pawnTicketUnitOfWork: PawnTicketUnitOfWork,
        private readonly attributeMapper: ItemAttributeMapper,
        private readonly controlNumberRepository: ControlNumberRepository
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto> {
        const parsed: CreatePawnTicketWithItemsRequestDto =
            createPawnTicketWithItemsRequestSchema.parse(input);

        const pawn = parsed.pawn;
        const items = parsed.items;

        // Everything below happens inside ONE DB transaction
        return this.pawnTicketUnitOfWork.runInTransaction(
            async ({ inventoryItemRepository, pawnTicketRepository, dbClient }) => {
                // 1) Get the next control number using the repository
                const transactionType = pawn.transactionType || 'PAWN';
                let controlNumber: string;
                if (transactionType === 'PURCHASE') {
                    controlNumber = await this.controlNumberRepository.getNextPurchaseControlNumber(dbClient);
                } else {
                    controlNumber = await this.controlNumberRepository.getNextPawnControlNumber(dbClient);
                }

                // 2) Create inventory items with the control number
                const createInventoryItemOnPawnUseCase = new CreateInventoryItemOnPawnTicketUseCase(
                    inventoryItemRepository,
                    this.attributeMapper
                );
                const allItemIds: string[] = [];
                for (let i = 0; i < items.length; i++) {
                    const itemDto = items[i];
                    const itemIndex = i + 1;
                    const createdItem = await createInventoryItemOnPawnUseCase.execute(
                        itemDto,
                        controlNumber,
                        itemIndex,
                        transactionType
                    );
                    allItemIds.push(createdItem.id);
                }

                // 3) Create pawn ticket with the items
                const createPawnTicketUseCase = new CreatePawnTicketUseCase(
                    pawnTicketRepository
                );

                const amountFinanced = Number(pawn.amountFinanced) || 0;
                const tenders = [{
                    tenderTypeId: 1,
                    amount: -Math.abs(amountFinanced)
                }];

                const pawnInput = {
                    ...pawn,
                    itemIds: allItemIds,
                    tenders,
                    controlNumber // pass control number to repo
                };

                const pawnTicket = await createPawnTicketUseCase.execute(pawnInput);
                return pawnTicket;
            }
        );
    }
}
