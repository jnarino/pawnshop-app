import { Pool } from 'pg';
import { loadSql } from '../../db/sqlLoader';

import { StoreTransactionRepository } from '../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransaction } from '../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../domains/storeTransaction/StoreTransactionItem';

const SQL_CREATE_TX = loadSql(
    'commands',
    'storeTransaction/store_transaction_create'
);
const SQL_INSERT_TENDER = loadSql(
    'commands',
    'storeTransaction/store_transaction_tender_insert'
);
const SQL_INSERT_ITEM = loadSql(
    'commands',
    'storeTransaction/store_transaction_item_insert'
);

const SQL_LIST_BY_CUSTOMER = loadSql(
    'queries',
    'storeTransaction/store_transaction_list_by_customer'
);
const SQL_LIST_BY_DATE_RANGE = loadSql(
    'queries',
    'storeTransaction/store_transaction_list_by_date_range'
);
const SQL_TENDERS_BY_TX_IDS = loadSql(
    'queries',
    'storeTransaction/store_transaction_tenders_by_tx_ids'
);
const SQL_ITEMS_BY_TX_IDS = loadSql(
    'queries',
    'storeTransaction/store_transaction_items_by_tx_ids'
);

function mapRowToStoreTransactionHeader(row: any): {
    id: string;
    customerId: string | null;
    clerkUserId: string | null;
    typeId: number;
    occurredAt: Date;
    amount: number | null;
    taxSales: number | null;
    stateTax: number | null;
    taxExemptUsed: boolean;
    taxExemptCertificate: string | null;
    tenderChange: number | null;
    gunProcFee: number | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
} {
    return {
        id: row.id,
        customerId: row.customer_id,
        clerkUserId: row.clerk_user_id,
        typeId: row.type_id,
        occurredAt: row.occurred_at,
        amount: row.amount !== null ? Number(row.amount) : null,
        taxSales: row.tax_sales !== null ? Number(row.tax_sales) : null,
        stateTax: row.state_tax !== null ? Number(row.state_tax) : null,
        taxExemptUsed: row.tax_exempt_used,
        taxExemptCertificate: row.tax_exempt_certificate,
        tenderChange: row.tender_change !== null ? Number(row.tender_change) : null,
        gunProcFee: row.gun_proc_fee !== null ? Number(row.gun_proc_fee) : null,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapRowToTender(row: any): StoreTransactionTender {
    return new StoreTransactionTender({
        id: row.id,
        storeTransactionId: row.store_transaction_id,
        sequence: row.sequence,
        tenderTypeId: row.tender_type_id,
        amount: Number(row.amount),
        createdAt: row.created_at,
    });
}

function mapRowToItem(row: any): StoreTransactionItem {
    return new StoreTransactionItem({
        id: row.id,
        storeTransactionId: row.store_transaction_id,
        sequence: row.sequence,
        inventoryItemId: row.inventory_item_id,
        description: row.description,
        quantity: Number(row.quantity),
        lineAmount: row.line_amount !== null ? Number(row.line_amount) : null,
        lineCost: row.line_cost !== null ? Number(row.line_cost) : null,
        taxExempt: row.tax_exempt,
        countyTaxExempt: row.county_tax_exempt,
        returned: row.returned,
        status: row.status,
        createdAt: row.created_at,
    });
}

export class PgStoreTransactionRepository implements StoreTransactionRepository {
    constructor(private readonly pool: Pool) { }

    /**
     * Creates a store_transaction header + tenders + items
     * in a single DB transaction.
     */
    async create(tx: StoreTransaction): Promise<StoreTransaction> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const headerResult = await client.query(SQL_CREATE_TX, [
                tx.id,
                tx.customerId,
                tx.clerkUserId,
                tx.typeId,
                tx.occurredAt,
                tx.amount,
                tx.taxSales,
                tx.taxExemptUsed,
                tx.taxExemptCertificate,
                tx.stateTax,
                tx.tenderChange,
                tx.gunProcFee,
                tx.note,
            ]);

            const header = mapRowToStoreTransactionHeader(headerResult.rows[0]);

            // Insert tenders
            for (const tender of tx.tenders) {
                await client.query(SQL_INSERT_TENDER, [
                    tender.id,
                    tender.storeTransactionId,
                    tender.sequence,
                    tender.tenderTypeId,
                    tender.amount,
                ]);
            }

            // Insert items
            for (const item of tx.items) {
                await client.query(SQL_INSERT_ITEM, [
                    item.id,
                    item.storeTransactionId,
                    item.sequence,
                    item.inventoryItemId,
                    item.description,
                    item.quantity,
                    item.lineAmount,
                    item.lineCost,
                    item.taxExempt,
                    item.countyTaxExempt,
                    item.returned,
                    item.status,
                ]);
            }

            await client.query('COMMIT');

            return new StoreTransaction({
                ...header,
                tenders: tx.tenders,
                items: tx.items,
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Load all store transactions for a customer, with tenders + items.
     */
    async listByCustomer(customerId: string): Promise<StoreTransaction[]> {
        const headerResult = await this.pool.query(SQL_LIST_BY_CUSTOMER, [
            customerId,
        ]);
        if (headerResult.rows.length === 0) {
            return [];
        }

        const headers = headerResult.rows.map(mapRowToStoreTransactionHeader);
        const txIds = headers.map((h) => h.id);

        const tendersResult = await this.pool.query(SQL_TENDERS_BY_TX_IDS, [
            txIds,
        ]);
        const itemsResult = await this.pool.query(SQL_ITEMS_BY_TX_IDS, [txIds]);

        const tendersByTx = new Map<string, StoreTransactionTender[]>();
        for (const row of tendersResult.rows) {
            const tender = mapRowToTender(row);
            const key = tender.storeTransactionId;
            if (!tendersByTx.has(key)) {
                tendersByTx.set(key, []);
            }
            tendersByTx.get(key)!.push(tender);
        }

        const itemsByTx = new Map<string, StoreTransactionItem[]>();
        for (const row of itemsResult.rows) {
            const item = mapRowToItem(row);
            const key = item.storeTransactionId;
            if (!itemsByTx.has(key)) {
                itemsByTx.set(key, []);
            }
            itemsByTx.get(key)!.push(item);
        }

        return headers.map(
            (h) =>
                new StoreTransaction({
                    ...h,
                    tenders: tendersByTx.get(h.id) ?? [],
                    items: itemsByTx.get(h.id) ?? [],
                })
        );
    }

    /**
     * Load all store transactions whose occurred_at is between `from` and `to`
     * (inclusive), ordered newest first.
     */
    async listByDateRange(params: {
        from: Date;
        to: Date;
    }): Promise<StoreTransaction[]> {
        const { from, to } = params;

        const headerResult = await this.pool.query(SQL_LIST_BY_DATE_RANGE, [
            from,
            to,
        ]);
        if (headerResult.rows.length === 0) {
            return [];
        }

        const headers = headerResult.rows.map(mapRowToStoreTransactionHeader);
        const txIds = headers.map((h) => h.id);

        const tendersResult = await this.pool.query(SQL_TENDERS_BY_TX_IDS, [
            txIds,
        ]);
        const itemsResult = await this.pool.query(SQL_ITEMS_BY_TX_IDS, [txIds]);

        const tendersByTx = new Map<string, StoreTransactionTender[]>();
        for (const row of tendersResult.rows) {
            const tender = mapRowToTender(row);
            const key = tender.storeTransactionId;
            if (!tendersByTx.has(key)) {
                tendersByTx.set(key, []);
            }
            tendersByTx.get(key)!.push(tender);
        }

        const itemsByTx = new Map<string, StoreTransactionItem[]>();
        for (const row of itemsResult.rows) {
            const item = mapRowToItem(row);
            const key = item.storeTransactionId;
            if (!itemsByTx.has(key)) {
                itemsByTx.set(key, []);
            }
            itemsByTx.get(key)!.push(item);
        }

        return headers.map(
            (h) =>
                new StoreTransaction({
                    ...h,
                    tenders: tendersByTx.get(h.id) ?? [],
                    items: itemsByTx.get(h.id) ?? [],
                })
        );
    }
}
