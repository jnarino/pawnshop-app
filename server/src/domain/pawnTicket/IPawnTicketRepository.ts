import { PawnTicket, CreatePawnTicketInput } from './PawnTicket';
import type { PoolClient } from 'pg';

export interface CreatePawnTicketPaymentInput {
    pawnTicketId: string;
    storeTransactionId: string;
    paymentDate: Date;
    interestPaid: number;
    principalPaid: number; // Can be negative for disbursements
    feesPaid: number;
    clerkUserId?: string;
    note?: string;
}

export interface IPawnTicketRepository {
    create(input: CreatePawnTicketInput): Promise<string>; // ✅ Renamed
    createInTransaction(client: PoolClient, ticket: PawnTicket): Promise<string>; // ✅ Accept PawnTicket object
    createPawnTicketPayment(client: PoolClient, input: CreatePawnTicketPaymentInput): Promise<string>;
    findAll(limit?: number, offset?: number, filters?: { customerId?: string; pawnStatus?: PawnTicket['pawnStatus'] }): Promise<PawnTicket[]>;
    findById(id: string): Promise<PawnTicket | null>;
    findByControlNumberWithPayments(controlNumber: string): Promise<any | null>;
    search(opts: { customerId?: string; type?: string; startDate?: string; endDate?: string; limit?: number; offset?: number; }): Promise<PawnTicket[]>;
    update(id: string, dto: Partial<PawnTicket>): Promise<boolean>;
    updateDates(id: string, maturityDate?: string, defaultDate?: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    getNextControlNumber(): Promise<string>;
}