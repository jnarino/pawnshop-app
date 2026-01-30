import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import {
    listPawnTicketsByCustomerRequestSchema,
    ListPawnTicketsByCustomerRequestDto,
} from '../../../dto/pawnTicket/query/ListPawnTicketsByCustomerRequestDto';
import {
    PawnTicketResponseDto,
} from '../../../dto/pawnTicket/query/PawnTicketResponseDto';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { GetPawnTicketCurrentChargesUseCase } from './GetPawnTicketCurrentChargesUseCase';

export class ListPawnTicketsByCustomerUseCase {
    constructor(
        private readonly pawnTicketRepository: PawnTicketRepository,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto[]> {
        const dto: ListPawnTicketsByCustomerRequestDto =
            listPawnTicketsByCustomerRequestSchema.parse(input);

        const tickets = await this.pawnTicketRepository.findByCustomer(
            dto.customerId
        );

        const dtos = await Promise.all(tickets.map(async (ticket) => {
            let redemptionAmount: number | undefined;

            if (ticket.transactionType === 'PAWN' && ticket.pawnStatus === 'P') {
                try {
                    const charges = await this.getPawnTicketCurrentChargesUseCase.execute({
                        controlNumber: ticket.controlNumber
                    });
                    redemptionAmount = charges.redemptionAmount;
                } catch (error) {
                    // Ignore errors in charges calculation
                }
            }
            return PawnTicketMapper.toResponseDto(ticket, { redemptionAmount });
        }));

        return dtos;
    }
}
