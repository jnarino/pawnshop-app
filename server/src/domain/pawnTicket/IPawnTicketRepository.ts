import type { PawnTicket, CreatePawnTicketInput } from './PawnTicket';

export interface IPawnTicketRepository {
    findAll(
        limit?: number,
        offset?: number,
        filters?: { customerId?: string; pawnStatus?: PawnTicket['pawnStatus'] }
    ): Promise<PawnTicket[]>;
    findById(id: string): Promise<PawnTicket | null>;
    create(input: CreatePawnTicketInput): Promise<string>; // changed
    update(id: string, dto: Partial<PawnTicket>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
}