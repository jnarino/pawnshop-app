import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import {
    listActivePawnTicketsByCustomerRequestSchema,
    ListActivePawnTicketsByCustomerRequestDto
} from '../../../dto/pawnTicket/query/ListActivePawnTicketsByCustomerRequestDto';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

export class ListActivePawnTicketsByCustomerUseCase {
    constructor(
        private readonly pawnTicketRepository: PawnTicketRepository
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto[]> {
        const dto: ListActivePawnTicketsByCustomerRequestDto =
            listActivePawnTicketsByCustomerRequestSchema.parse(input);

        const tickets =
            await this.pawnTicketRepository.listActiveByCustomer(dto.customerId);

        return tickets.map(PawnTicketMapper.toResponseDto);
    }
}
