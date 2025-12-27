

import { Pool, PoolClient } from 'pg';
import { loadSql } from '../../db/sqlLoader';
import { PawnTicketRepository } from '../../../domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../domains/pawnTicket/PawnTicket';
import { InventoryItem } from '../../../domains/inventory/InventoryItem';


const SQL_UPDATE_PAYMENT_FIELDS = loadSql(
    'commands',
    'pawnTicket/pawn_ticket_update_payment_fields'
);


const SQL_ADD_PAYMENT = loadSql(
    'commands',
    'pawnTicket/pawn_ticket_add_payment'
);

const SQL_SET_STATUS = loadSql(
    'commands',
    'pawnTicket/pawn_ticket_set_status'
);

type DbClient = Pool | PoolClient;

const SQL_CREATE = loadSql(
    'commands',
    'pawnTicket/pawn_ticket_create'
);

const SQL_LIST_BY_CONTROL_NUMBER = loadSql(
    'queries',
    'pawnTicket/pawn_ticket_list_by_control_number'
);

const SQL_FIND_BY_CUSTOMER = loadSql(
    'queries',
    'pawnTicket/pawn_ticket_find_by_customer'
);

const SQL_LIST_ACTIVE_BY_CUSTOMER = loadSql(
    'queries',
    'pawnTicket/pawn_ticket_list_active_by_customer'
);

const SQL_FIND_BY_DATE_RANGE = loadSql(
    'queries',
    'pawnTicket/pawn_ticket_find_by_date_range'
);

const SQL_FIND_BY_ID = loadSql(
    'queries',
    'pawnTicket/pawn_ticket_find_by_id'
);

function mapJsonbToInventoryItem(itemData: any): InventoryItem {
    // Helper to unwrap id/name or fallback to id
    const unwrapLookup = (val: any) => {
        if (!val) return null;
        if (typeof val === 'object' && 'id' in val && 'name' in val) return val;
        return { id: val, name: null };
    };

    // Map colorId as id/name object if present
    const colorId = unwrapLookup(itemData.color_id);

    // Map extra.stones array with id/name for type/color/shape
    let extra = itemData.extra || {};
    if (extra.stones && Array.isArray(extra.stones)) {
        extra = {
            ...extra,
            stones: extra.stones.map((stone: any) => ({
                ...stone,
                type: unwrapLookup(stone.type),
                color: unwrapLookup(stone.color),
                shape: unwrapLookup(stone.shape)
            }))
        };
    }

    // Map attributes lookups as id/name
    let attributes = itemData.attributes || {};
    const attrFields = ['karat', 'metal', 'style', 'gender', 'sizeLength'];
    attributes = { ...attributes };
    for (const field of attrFields) {
        if (attributes[field]) {
            attributes[field] = unwrapLookup(attributes[field]);
        }
    }

    const item = new InventoryItem({
        id: itemData.id,
        inventorySubcategoryId: itemData.inventory_subcategory?.id || '',
        status: itemData.status,
        quantity: itemData.quantity,
        brand: itemData.brand?.id || null,
        model: itemData.model,
        serialNumber: itemData.serial_number,
        colorId,
        itemCondition: itemData.item_condition,
        ownerMark: itemData.owner_mark,
        itemDescription: itemData.item_description,
        priceAmount: itemData.price_amount !== null ? Number(itemData.price_amount) : null,
        resale: itemData.resale !== null ? Number(itemData.resale) : null,
        minResale: itemData.min_resale !== null ? Number(itemData.min_resale) : null,
        itemReplace: itemData.item_replace !== null ? Number(itemData.item_replace) : null,
        extra,
        attributes,
        legacyInventoryNumber: itemData.legacy_inventory_number,
        legacyItemGuid: itemData.legacy_item_guid,
        legacyCategoryDescription: itemData.legacy_category_description,
        legacyBrandColorDescription: itemData.legacy_brand_color_description,
        inventoryNumber: itemData.inventory_number,
        lastUpdatedUserId: itemData.last_updated_user_id,
        createdAt: new Date(itemData.created_at),
        updatedAt: new Date(itemData.updated_at)
    });

    // Attach the enriched lookup data for the mapper to use
    (item as any)._enrichedData = {
        inventorySubcategory: itemData.inventory_subcategory,
        inventoryCategory: itemData.inventory_category,
        brand: itemData.brand
    };

    return item;
}

function mapRowToPawnTicket(row: any): PawnTicket {
    return new PawnTicket({
        id: row.id,
        controlNumber: row.control_number,
        transactionType: row.transaction_type,
        customerId: row.customer_id,
        clerkUserId: row.clerk_user_id || '',
        amountFinanced:
            row.amount_financed !== null ? Number(row.amount_financed) : null,
        originalPawnAmount:
            row.original_pawn_amount !== null ? Number(row.amount_financed) : null,
        periodicRate:
            row.periodic_rate !== null ? Number(row.periodic_rate) : null,
        apr:
            row.apr !== null ? Number(row.apr) : null,
        purchaseTradeValue:
            row.purchase_trade_value !== null
                ? Number(row.purchase_trade_value)
                : null,
        transactionDate: row.transaction_date ? new Date(row.transaction_date) : new Date(0),
        maturityDate: row.maturity_date ? new Date(row.maturity_date) : new Date(0),
        defaultDate: row.default_date ? new Date(row.default_date) : new Date(0),
        pawnStatus: row.pawn_status,
        createdDate: row.created_at ? new Date(row.created_at) : new Date(0),
        itemIds: Array.isArray(row.item_ids) ? row.item_ids : [],
        items: row.items_data ?
            (Array.isArray(row.items_data) ? row.items_data.map(mapJsonbToInventoryItem) : []) :
            undefined,
        tenders: row.tenders || [],
        customer: (row.first_name && row.last_name) ? {
            firstName: row.first_name,
            lastName: row.last_name
        } : undefined
    });
}

export class PgPawnTicketRepository implements PawnTicketRepository {
    constructor(private readonly db: DbClient) { }

    async addPayment(pawnTicketId: string, amount: number): Promise<void> {
        await this.db.query(SQL_ADD_PAYMENT, [pawnTicketId, amount]);
    }

    // ...existing code...
    // ...existing code...

    async setStatus(pawnTicketId: string, status: string): Promise<void> {
        await this.db.query(SQL_SET_STATUS, [pawnTicketId, status]);
    }

    async create(ticket: PawnTicket): Promise<PawnTicket> {
        // Convert tenders array to JSONB format
        const tendersJson = JSON.stringify(ticket.tenders);

        const result = await this.db.query(SQL_CREATE, [
            ticket.id,                  // $1
            ticket.transactionType,     // $2
            ticket.customerId,          // $3
            ticket.clerkUserId,         // $4
            ticket.amountFinanced,      // $5
            ticket.originalPawnAmount,  // $6
            ticket.periodicRate,        // $7
            ticket.apr,                 // $8
            ticket.purchaseTradeValue,  // $9
            ticket.transactionDate,     // $10
            ticket.maturityDate,        // $11
            ticket.defaultDate,         // $12
            ticket.itemIds,             // $13
            tendersJson,                // $14
            ticket.note,                // $15
            ticket.controlNumber        // $16 (new param)
        ]);

        const row = result.rows[0];

        // We already know itemIds
        const created = mapRowToPawnTicket({
            ...row,
            item_ids: ticket.itemIds
        });

        return created;
    }

    async listByControlNumber(controlNumber: string): Promise<PawnTicket[]> {
        const result = await this.db.query(SQL_LIST_BY_CONTROL_NUMBER, [
            controlNumber
        ]);
        return result.rows.map(mapRowToPawnTicket);
    }

    async findByCustomer(customerId: string): Promise<PawnTicket[]> {
        const result = await this.db.query(SQL_FIND_BY_CUSTOMER, [customerId]);
        return result.rows.map(mapRowToPawnTicket);
    }

    async findByDateRange(from: Date, to: Date): Promise<PawnTicket[]> {
        const result = await this.db.query(SQL_FIND_BY_DATE_RANGE, [from, to]);
        return result.rows.map(mapRowToPawnTicket);
    }

    async listActiveByCustomer(customerId: string): Promise<PawnTicket[]> {
        const result = await this.db.query(SQL_LIST_ACTIVE_BY_CUSTOMER, [
            customerId
        ]);
        return result.rows.map(mapRowToPawnTicket);
    }


    async findById(id: string): Promise<PawnTicket | null> {
        const result = await this.db.query(SQL_FIND_BY_ID, [id]);
        if (result.rowCount === 0) return null;
        return mapRowToPawnTicket(result.rows[0]);
    }

    async updatePaymentFields(params: {
        pawnTicketId: string;
        paymentAmount: number;
        transactionDate: Date;
        updatedAt: Date;
        defaultDate: Date;
        maturityDate: Date;
        setRedeemed: boolean;
    }): Promise<void> {
        const statusClause = params.setRedeemed ? ', pawn_status = \'U\'' : '';
        const sql = SQL_UPDATE_PAYMENT_FIELDS.replace('{STATUS_CLAUSE}', statusClause);
        await this.db.query(sql, [
            params.paymentAmount,
            params.transactionDate,
            params.updatedAt,
            params.defaultDate,
            params.maturityDate,
            params.pawnTicketId
        ]);
    }
}
