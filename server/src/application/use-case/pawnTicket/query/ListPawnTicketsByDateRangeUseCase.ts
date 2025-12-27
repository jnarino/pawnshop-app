import { z } from 'zod';
import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

const listByDateRangeSchema = z.object({
    from: z.string().transform((str) => new Date(str)),
    to: z.string().transform((str) => new Date(str)),
});

export class ListPawnTicketsByDateRangeUseCase {
    constructor(private readonly pawnTicketRepository: PawnTicketRepository) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto[]> {
        const { from, to } = listByDateRangeSchema.parse(input);
        const tickets = await this.pawnTicketRepository.findByDateRange(from, to);
        return tickets.map((ticket) => PawnTicketMapper.toResponseDto(ticket));
    }
}
