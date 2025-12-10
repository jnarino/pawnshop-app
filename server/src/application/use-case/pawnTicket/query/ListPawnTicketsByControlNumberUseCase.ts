import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import {
    listPawnTicketsByControlNumberRequestSchema,
    ListPawnTicketsByControlNumberRequestDto
} from '../../../dto/pawnTicket/query/ListPawnTicketsByControlNumberRequestDto';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

export class ListPawnTicketsByControlNumberUseCase {
    constructor(
        private readonly pawnTicketRepository: PawnTicketRepository
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto[]> {
        const dto: ListPawnTicketsByControlNumberRequestDto =
            listPawnTicketsByControlNumberRequestSchema.parse(input);

        const tickets =
            await this.pawnTicketRepository.listByControlNumber(dto.controlNumber);

        return tickets.map(PawnTicketMapper.toResponseDto);
    }
}
