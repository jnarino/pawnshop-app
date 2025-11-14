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
    findAll(limit?: number, offset?: number, filters?: { customerId?: string; pawnStatus?: string; }): Promise<any[]>;
    findById(id: string): Promise<PawnTicket | null>;
    findByControlNumberWithPayments(controlNumber: string): Promise<any | null>;
    create(input: CreatePawnTicketInput): Promise<string>;
    createInTransaction(client: PoolClient, ticket: PawnTicket): Promise<string>; // ✅ Fix: Return string like implementation
    updateDates(id: string, maturityDate: string, defaultDate: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    search(filters: {
        controlNumber?: string;
        customerId?: string;
        status?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }, limit?: number, offset?: number): Promise<any[]>;
    getNextControlNumber(): Promise<string>;
    createPawnTicketPayment(client: PoolClient, input: CreatePawnTicketPaymentInput): Promise<string>; // ✅ Fix: Return string like implementation
}