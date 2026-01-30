import { z } from 'zod';
import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

import { GetPawnTicketCurrentChargesUseCase } from './GetPawnTicketCurrentChargesUseCase';

const listByDateRangeSchema = z.object({
    from: z.string().transform((str) => new Date(str)),
    to: z.string().transform((str) => new Date(str)),
});

export class ListPawnTicketsByDateRangeUseCase {
    constructor(
        private readonly pawnTicketRepository: PawnTicketRepository,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto[]> {
        const { from, to } = listByDateRangeSchema.parse(input);
        const tickets = await this.pawnTicketRepository.findByDateRange(from, to);

        const dtos = await Promise.all(tickets.map(async (ticket) => {
            let redemptionAmount: number | undefined;

            if (ticket.transactionType === 'PAWN' && ticket.pawnStatus === 'P') {
                try {
                    const charges = await this.getPawnTicketCurrentChargesUseCase.execute({
                        controlNumber: ticket.controlNumber
                    });
                    redemptionAmount = charges.redemptionAmount;
                } catch (error) {
                    // If charges calculation fails (e.g. invalid status), ignore
                }
            }

            return PawnTicketMapper.toResponseDto(ticket, { redemptionAmount });
        }));

        return dtos;
    }
}
