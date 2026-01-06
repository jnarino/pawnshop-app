import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import {
    listActivePawnTicketsByCustomerRequestSchema,
    ListActivePawnTicketsByCustomerRequestDto
} from '../../../dto/pawnTicket/query/ListActivePawnTicketsByCustomerRequestDto';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';
import { GetPawnTicketCurrentChargesUseCase } from './GetPawnTicketCurrentChargesUseCase';

export class ListActivePawnTicketsByCustomerUseCase {
    constructor(
        private readonly pawnTicketRepository: PawnTicketRepository,
        private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase
    ) { }

    async execute(input: unknown): Promise<PawnTicketResponseDto[]> {
        const dto: ListActivePawnTicketsByCustomerRequestDto =
            listActivePawnTicketsByCustomerRequestSchema.parse(input);

        const tickets = await this.pawnTicketRepository.listActiveByCustomer(dto.customerId);

        // Fetch charges for each ticket
        const results: PawnTicketResponseDto[] = [];
        for (const ticket of tickets) {
            let charges = undefined;
            try {
                charges = await this.getPawnTicketCurrentChargesUseCase.execute({ controlNumber: ticket.controlNumber });
            } catch (err) {
                // If error, leave charges undefined
            }
            // Remove tenders for this use case
            const dto = PawnTicketMapper.toResponseDto(ticket, charges);
            results.push(dto);
        }
        return results;
    }
}
