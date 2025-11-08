import type { IPawnTicketRepository } from '../../../domain/pawnTicket/IPawnTicketRepository';
import type { PawnTicket } from '../../../domain/pawnTicket/PawnTicket';

export class FindAllPawnTicketsUseCase {
    constructor(private repo: IPawnTicketRepository) { }
    execute(
        limit?: number,
        offset?: number,
        filters?: { customerId?: string; pawnStatus?: PawnTicket['pawnStatus'] }
    ): Promise<PawnTicket[]> {
        return this.repo.findAll(limit, offset, filters);
    }
}