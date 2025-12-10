import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import {
    listPawnTicketsByCustomerRequestSchema,
    ListPawnTicketsByCustomerRequestDto
} from '../../../dto/pawnTicket/query/ListPawnTicketsByCustomerRequestDto';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

export class FindPawnTicketsByCustomerUseCase {
    constructor(
        private readonly pawnTicketRepository: PawnTicketRepository
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto[]> {
        const dto: ListPawnTicketsByCustomerRequestDto =
            listPawnTicketsByCustomerRequestSchema.parse(input);

        const tickets =
            await this.pawnTicketRepository.findByCustomer(dto.customerId);

        return tickets.map(PawnTicketMapper.toResponseDto);
    }
}
