import type { PawnTicket, CreatePawnTicketInput } from './PawnTicket';
import type { PoolClient } from 'pg';

export interface IPawnTicketRepository {
    createSingleTicket(input: CreatePawnTicketInput): Promise<string>; // ✅ Renamed
    createInTransaction(client: PoolClient, input: CreatePawnTicketInput): Promise<string>; // ✅ Added
    findById(id: string): Promise<PawnTicket | null>;
    findAll(limit?: number, offset?: number, filters?: { customerId?: string; pawnStatus?: PawnTicket['pawnStatus'] }): Promise<PawnTicket[]>;
    update(id: string, dto: Partial<PawnTicket>): Promise<boolean>;
    updateDates(id: string, maturityDate?: string, defaultDate?: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    search(opts: {
        customerId?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }): Promise<PawnTicket[]>;
    getNextControlNumber(): Promise<string>;
}