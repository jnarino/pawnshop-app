import { StoreTransaction } from './StoreTransaction';

export interface StoreTransactionRepository {
    /**
     * Persist a store transaction along with its tenders and items
     * in a single database transaction.
     */
    create(tx: StoreTransaction, tempInventoryUpdates?: { id: string, quantity: number }[]): Promise<StoreTransaction>;

    /**
     * Create a payment/redemption store transaction (minimal fields).
     */
    createPayment(params: {
        pawnTicketId: string;
        controlNumber: string;
        clerkUserId: string;
        typeId: number;
        amount: number;
        tenders: { tenderTypeId: number; amount: number }[];
    }): Promise<void>;

    /**
     * All store transactions for a given customer, ordered newest first.
     */
    listByCustomer(customerId: string): Promise<StoreTransaction[]>;

    /**
     * All store transactions in a given date range, ordered newest first.
     *
     * from/to are *inclusive* bounds at the JS Date level; the
     * infrastructure layer will map them to the appropriate
     * SQL range (e.g. occurred_at BETWEEN $1 AND $2).
     */
    listByDateRange(params: {
        from: Date;
        to: Date;
    }): Promise<StoreTransaction[]>;

    /**
     * Get the last MAIN BALANCE (close) transaction.
     * Returns null if no close has been recorded.
     */
    getLastClose(): Promise<{
        id: string;
        occurredAt: Date;
        amount: number;
    } | null>;

    /**
     * Get all store transactions and their tender details since the last close.
     */
    getActivitySinceClose(): Promise<Array<{
        id: string;
        occurredAt: Date;
        tenderTypeId: number;
        tenderTypeName: string;
        amount: number;
    }>>;
}
