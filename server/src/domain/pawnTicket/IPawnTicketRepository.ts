import type { PawnTicket, CreatePawnTicketInput } from './PawnTicket';
import type { PoolClient } from 'pg';

export interface IPawnTicketRepository {
    create(input: CreatePawnTicketInput): Promise<string>; // ✅ Renamed
    createInTransaction(client: PoolClient, ticket: PawnTicket): Promise<string>; // ✅ Accept PawnTicket object
    findAll(limit?: number, offset?: number, filters?: any): Promise<PawnTicket[]>;
    findById(id: string): Promise<PawnTicket | null>;
    update(id: string, updates: Partial<PawnTicket>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    search(filters: any): Promise<PawnTicket[]>;
    getNextControlNumber(): Promise<string>;
}