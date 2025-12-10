import { StoreTransaction } from './StoreTransaction';

export interface StoreTransactionRepository {
    /**
     * Persist a store transaction along with its tenders and items
     * in a single database transaction.
     */
    create(tx: StoreTransaction): Promise<StoreTransaction>;

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
}
