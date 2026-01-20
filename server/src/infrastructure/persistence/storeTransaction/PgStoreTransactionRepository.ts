import crypto from 'crypto';
import { Pool, PoolClient } from 'pg';
import { loadSql } from '../../db/sqlLoader';

import { StoreTransactionRepository } from '../../../domains/storeTransaction/StoreTransactionRepository';
import { StoreTransaction } from '../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionItem } from '../../../domains/storeTransaction/StoreTransactionItem';

const SQL_CREATE_PAYMENT = loadSql(
    'commands',
    'storeTransaction/store_transaction_create_payment');

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

const SQL_LIST_BY_CONTROL_NUMBER = loadSql(
    'queries',
    'storeTransaction/store_transaction_list_by_control_number'
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
const SQL_CASH_DRAWER_BALANCE = loadSql(
    'queries',
    'storeTransaction/cash_drawer_balance'
);
const SQL_CASH_DRAWER_ACTIVITY = loadSql(
    'queries',
    'storeTransaction/cash_drawer_activity_since_close'
);

function mapRowToStoreTransactionHeader(row: any): {
    id: string;
    customerId: string | null;
    clerkUserId: string | null;
    controlNumber: string | null;
    typeId: number;
    typeCode?: string;
    typeName?: string;
    occurredAt: Date;
    amount: number | null;
    taxSales: number | null;
    stateTax: number | null;
    taxExemptUsed: boolean;
    tenderChange: number | null;
    gunProcFee: number | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: {
        id: string;
        firstName: string | null;
        middleName: string | null;
        lastName: string | null;
        phoneNumber: string | null;
        cellPhone: string | null;
        email: string | null;
    };
} {
    const header: any = {
        id: row.id,
        customerId: row.customer_id,
        clerkUserId: row.clerk_user_id,
        controlNumber: row.legacy_ticketnum,
        typeId: row.type_id,
        typeCode: row.type_code,
        typeName: row.type_name,
        occurredAt: row.occurred_at,
        amount: row.amount !== null ? Number(row.amount) : null,
        taxSales: row.tax_sales !== null ? Number(row.tax_sales) : null,
        stateTax: row.state_tax !== null ? Number(row.state_tax) : null,
        taxExemptUsed: row.tax_exempt_used,
        tenderChange: row.tender_change !== null ? Number(row.tender_change) : null,
        gunProcFee: row.gun_proc_fee !== null ? Number(row.gun_proc_fee) : null,
        note: row.note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };

    // Add customer info if available (from queries that join customer table)
    // Check if customer columns are present (not null/undefined) - customer.id will be in row.customer_id (aliased column)
    if (row.customer_id && row.customer_first_name !== null) {
        header.customer = {
            id: row.customer_id,
            firstName: row.customer_first_name,
            middleName: row.customer_middle_name,
            lastName: row.customer_last_name,
            phoneNumber: row.customer_phone_number,
            cellPhone: row.customer_cell_phone,
            email: row.customer_email,
        };
    }

    return header;
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
        controlNumber: row.legacy_ticketnum,
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
    private readonly updateInventoryItemSql: string;

    constructor(private readonly pool: Pool | PoolClient) {
        this.updateInventoryItemSql = loadSql('commands', 'inventory/inventory_item_update_quantity_and_status');
    }
    async createPayment(params: {
        pawnTicketId: string;
        controlNumber: string;
        clerkUserId: string;
        typeId: number;
        amount: number;
        tenders: { tenderTypeId: number; amount: number }[];
    }): Promise<void> {
        // Create the store transaction
        const txResult = await this.pool.query(SQL_CREATE_PAYMENT, [
            params.pawnTicketId,
            params.clerkUserId,
            params.typeId,
            params.amount,
            params.controlNumber
        ]);

        const transactionId = txResult.rows[0].id;

        // Insert all tenders
        for (let i = 0; i < params.tenders.length; i++) {
            const tender = params.tenders[i];
            await this.pool.query(SQL_INSERT_TENDER, [
                crypto.randomUUID(),
                transactionId,
                i + 1,
                tender.tenderTypeId,
                tender.amount
            ]);
        }
    }

    /**
     * Creates a store_transaction header + tenders + items
     * in a single DB transaction.
     */
    async create(tx: StoreTransaction, tempInventoryUpdates: { id: string, quantity: number }[] = []): Promise<StoreTransaction> {
        const client: PoolClient = await (this.pool as Pool).connect();
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
                tx.stateTax,
                tx.tenderChange,
                tx.gunProcFee,
                tx.note,
                tx.createdAt,
                tx.updatedAt,
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

            // Update inventory items (if any specific inventory updates are requested)
            // Use external SQL file for inventory_item update
            for (const update of tempInventoryUpdates) {
                await client.query(this.updateInventoryItemSql, [update.id, update.quantity]);
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
        const result = await this.pool.query(SQL_LIST_BY_CUSTOMER, [customerId]);
        if (result.rows.length === 0) {
            return [];
        }

        // Group rows by transaction ID (since LEFT JOIN creates multiple rows per transaction)
        const txMap = new Map<string, any[]>();
        for (const row of result.rows) {
            if (!txMap.has(row.id)) {
                txMap.set(row.id, []);
            }
            txMap.get(row.id)!.push(row);
        }

        const transactions: StoreTransaction[] = [];
        const txIds = Array.from(txMap.keys());

        // Fetch tenders separately (still needed)
        const tendersResult = await this.pool.query(SQL_TENDERS_BY_TX_IDS, [txIds]);
        const tendersByTx = new Map<string, StoreTransactionTender[]>();
        for (const row of tendersResult.rows) {
            const tender = mapRowToTender(row);
            const key = tender.storeTransactionId;
            if (!tendersByTx.has(key)) {
                tendersByTx.set(key, []);
            }
            tendersByTx.get(key)!.push(tender);
        }

        // Process each transaction
        for (const [txId, rows] of txMap.entries()) {
            const firstRow = rows[0];
            const header = mapRowToStoreTransactionHeader(firstRow);

            // Extract items from the rows
            const items: StoreTransactionItem[] = [];
            for (const row of rows) {
                if (row.item_id) {
                    items.push(new StoreTransactionItem({
                        id: row.item_id,
                        storeTransactionId: row.item_store_transaction_id,
                        controlNumber: row.legacy_ticketnum,
                        sequence: row.item_sequence,
                        inventoryItemId: row.item_inventory_item_id,
                        description: row.item_description,
                        quantity: Number(row.item_quantity),
                        lineAmount: row.item_line_amount !== null ? Number(row.item_line_amount) : null,
                        lineCost: row.item_line_cost !== null ? Number(row.item_line_cost) : null,
                        taxExempt: row.item_tax_exempt,
                        countyTaxExempt: row.item_county_tax_exempt,
                        returned: row.item_returned,
                        status: row.item_status,
                        createdAt: row.item_created_at,
                    }));
                }
            }

            const tx = new StoreTransaction({
                ...header,
                tenders: tendersByTx.get(txId) || [],
                items: items,
            });
            // Preserve customer object from header if present
            if (header.customer) {
                (tx as any).customer = header.customer;
            }
            // Preserve typeCode and typeName from header if present
            if (header.typeCode) {
                (tx as any).typeCode = header.typeCode;
            }
            if (header.typeName) {
                (tx as any).typeName = header.typeName;
            }
            transactions.push(tx);
        }

        return transactions;
    }

    /**
     * List all store transactions whose occurred_at falls in the control number range.
     */
    async listByControlNumber(controlNumber: string): Promise<StoreTransaction[]> {
        const result = await this.pool.query(SQL_LIST_BY_CONTROL_NUMBER, [controlNumber]);
        if (result.rows.length === 0) {
            return [];
        }

        // Group rows by transaction ID (since LEFT JOIN creates multiple rows per transaction)
        const txMap = new Map<string, any[]>();
        for (const row of result.rows) {
            if (!txMap.has(row.id)) {
                txMap.set(row.id, []);
            }
            txMap.get(row.id)!.push(row);
        }

        const transactions: StoreTransaction[] = [];
        const txIds = Array.from(txMap.keys());

        // Fetch tenders separately (still needed)
        const tendersResult = await this.pool.query(SQL_TENDERS_BY_TX_IDS, [txIds]);
        const tendersByTx = new Map<string, StoreTransactionTender[]>();
        for (const row of tendersResult.rows) {
            const tender = mapRowToTender(row);
            const key = tender.storeTransactionId;
            if (!tendersByTx.has(key)) {
                tendersByTx.set(key, []);
            }
            tendersByTx.get(key)!.push(tender);
        }

        // Process each transaction
        for (const [txId, rows] of txMap.entries()) {
            const firstRow = rows[0];
            const header = mapRowToStoreTransactionHeader(firstRow);

            // Extract items from the rows
            const items: StoreTransactionItem[] = [];
            for (const row of rows) {
                if (row.item_id) {
                    items.push(new StoreTransactionItem({
                        id: row.item_id,
                        storeTransactionId: row.item_store_transaction_id,
                        controlNumber: row.legacy_ticketnum,
                        sequence: row.item_sequence,
                        inventoryItemId: row.item_inventory_item_id,
                        description: row.item_description,
                        quantity: Number(row.item_quantity),
                        lineAmount: row.item_line_amount !== null ? Number(row.item_line_amount) : null,
                        lineCost: row.item_line_cost !== null ? Number(row.item_line_cost) : null,
                        taxExempt: row.item_tax_exempt,
                        countyTaxExempt: row.item_county_tax_exempt,
                        returned: row.item_returned,
                        status: row.item_status,
                        createdAt: row.item_created_at,
                    }));
                }
            }

            const tx = new StoreTransaction({
                ...header,
                tenders: tendersByTx.get(txId) || [],
                items: items,
            });
            // Preserve customer object from header if present
            if (header.customer) {
                (tx as any).customer = header.customer;
            }
            // Preserve typeCode and typeName from header if present
            if (header.typeCode) {
                (tx as any).typeCode = header.typeCode;
            }
            if (header.typeName) {
                (tx as any).typeName = header.typeName;
            }
            transactions.push(tx);
        }

        return transactions;
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

        const result = await this.pool.query(SQL_LIST_BY_DATE_RANGE, [
            from,
            to,
        ]);
        if (result.rows.length === 0) {
            return [];
        }

        // Group rows by transaction ID (since LEFT JOIN creates multiple rows per transaction)
        const txMap = new Map<string, any[]>();
        for (const row of result.rows) {
            if (!txMap.has(row.id)) {
                txMap.set(row.id, []);
            }
            txMap.get(row.id)!.push(row);
        }

        const transactions: StoreTransaction[] = [];
        const txIds = Array.from(txMap.keys());

        // Fetch tenders separately (still needed)
        const tendersResult = await this.pool.query(SQL_TENDERS_BY_TX_IDS, [txIds]);
        const tendersByTx = new Map<string, StoreTransactionTender[]>();
        for (const row of tendersResult.rows) {
            const tender = mapRowToTender(row);
            const key = tender.storeTransactionId;
            if (!tendersByTx.has(key)) {
                tendersByTx.set(key, []);
            }
            tendersByTx.get(key)!.push(tender);
        }

        // Process each transaction
        for (const [txId, rows] of txMap.entries()) {
            const firstRow = rows[0];
            const header = mapRowToStoreTransactionHeader(firstRow);

            // Extract items from the rows
            const items: StoreTransactionItem[] = [];
            for (const row of rows) {
                if (row.item_id) {
                    items.push(new StoreTransactionItem({
                        id: row.item_id,
                        storeTransactionId: row.item_store_transaction_id,
                        controlNumber: row.legacy_ticketnum,
                        sequence: row.item_sequence,
                        inventoryItemId: row.item_inventory_item_id,
                        description: row.item_description,
                        quantity: Number(row.item_quantity),
                        lineAmount: row.item_line_amount !== null ? Number(row.item_line_amount) : null,
                        lineCost: row.item_line_cost !== null ? Number(row.item_line_cost) : null,
                        taxExempt: row.item_tax_exempt,
                        countyTaxExempt: row.item_county_tax_exempt,
                        returned: row.item_returned,
                        status: row.item_status,
                        createdAt: row.item_created_at,
                    }));
                }
            }

            const tx = new StoreTransaction({
                ...header,
                tenders: tendersByTx.get(txId) || [],
                items: items,
            });
            // Preserve customer object from header if present
            if (header.customer) {
                (tx as any).customer = header.customer;
            }
            // Preserve typeCode and typeName from header if present
            if (header.typeCode) {
                (tx as any).typeCode = header.typeCode;
            }
            if (header.typeName) {
                (tx as any).typeName = header.typeName;
            }
            transactions.push(tx);
        }

        return transactions;
    }

    /**
     * Get the last MAIN BALANCE (close) transaction
     */
    async getLastClose(): Promise<{
        id: string;
        occurredAt: Date;
        amount: number;
    } | null> {
        const result = await this.pool.query(SQL_CASH_DRAWER_BALANCE);

        if (result.rows.length === 0) {
            return null;
        }

        return {
            id: result.rows[0].id,
            occurredAt: new Date(result.rows[0].occurred_at),
            amount: Number(result.rows[0].amount)
        };
    }

    /**
     * Get all store transactions and tenders since the last close
     */
    async getActivitySinceClose(): Promise<Array<{
        id: string;
        occurredAt: Date;
        tenderTypeId: number;
        tenderTypeName: string;
        amount: number;
    }>> {
        const result = await this.pool.query(SQL_CASH_DRAWER_ACTIVITY);

        if (result.rows.length === 0) {
            return [];
        }

        return result.rows.map((row: any) => ({
            id: row.id,
            occurredAt: new Date(row.occurred_at),
            tenderTypeId: row.tender_type_id,
            tenderTypeName: row.tender_type_name,
            amount: Number(row.amount)
        }));
    }
}
