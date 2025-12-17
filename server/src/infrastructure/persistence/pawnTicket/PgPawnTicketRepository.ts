import { Pool, PoolClient } from 'pg';
import { loadSql } from '../../db/sqlLoader';
import { PawnTicketRepository } from '../../../domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../domains/pawnTicket/PawnTicket';
import { InventoryItem } from '../../../domains/inventory/InventoryItem';


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

function mapJsonbToInventoryItem(itemData: any): InventoryItem {
    const item = new InventoryItem({
        id: itemData.id,
        inventorySubcategoryId: itemData.inventory_subcategory?.id || '',
        status: itemData.status,
        quantity: itemData.quantity,
        brand: itemData.brand?.id || null,
        model: itemData.model,
        serialNumber: itemData.serial_number,
        colorId: itemData.color_id,
        itemCondition: itemData.item_condition,
        ownerMark: itemData.owner_mark,
        itemDescription: itemData.item_description,
        priceAmount: itemData.price_amount !== null ? Number(itemData.price_amount) : null,
        resale: itemData.resale !== null ? Number(itemData.resale) : null,
        minResale: itemData.min_resale !== null ? Number(itemData.min_resale) : null,
        itemReplace: itemData.item_replace !== null ? Number(itemData.item_replace) : null,
        extra: itemData.extra || {},
        attributes: itemData.attributes || {},
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
        financeCharge:
            row.finance_charge !== null ? Number(row.finance_charge) : null,
        periodicRate:
            row.periodic_rate !== null ? Number(row.periodic_rate) : null,
        totalOfPayments:
            row.total_of_payments !== null ? Number(row.total_of_payments) : null,
        apr:
            row.apr !== null ? Number(row.apr) : null,
        ratePlanId: row.rate_plan_id || null,
        purchaseTradeValue:
            row.purchase_trade_value !== null
                ? Number(row.purchase_trade_value)
                : null,
        transactionDate: row.transaction_date,
        maturityDate: row.maturity_date,
        defaultDate: row.default_date,
        pawnStatus: row.pawn_status,
        createdDate: row.created_at,
        itemIds: Array.isArray(row.item_ids) ? row.item_ids : [],
        items: row.items_data ?
            (Array.isArray(row.items_data) ? row.items_data.map(mapJsonbToInventoryItem) : []) :
            undefined,
        tenders: row.tenders || []
    });
}

export class PgPawnTicketRepository implements PawnTicketRepository {
    constructor(private readonly db: DbClient) { }

    async create(ticket: PawnTicket): Promise<PawnTicket> {
        // Convert tenders array to JSONB format
        const tendersJson = JSON.stringify(ticket.tenders);

        const result = await this.db.query(SQL_CREATE, [
            ticket.id,                  // $1
            ticket.transactionType,     // $2
            ticket.customerId,          // $3
            ticket.clerkUserId,         // $4
            ticket.amountFinanced,      // $5
            ticket.financeCharge,       // $6
            ticket.periodicRate,        // $7
            ticket.totalOfPayments,     // $8
            ticket.apr,                 // $9
            ticket.ratePlanId,          // $10
            ticket.purchaseTradeValue,  // $11
            ticket.transactionDate,     // $12
            ticket.maturityDate,        // $13
            ticket.defaultDate,         // $14
            ticket.itemIds,             // $15
            tendersJson,                // $16
            ticket.note                 // $17
        ]);

        const row = result.rows[0];

        // Use the control_number generated by the DB, but we already know itemIds
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

    async listActiveByCustomer(customerId: string): Promise<PawnTicket[]> {
        const result = await this.db.query(SQL_LIST_ACTIVE_BY_CUSTOMER, [
            customerId
        ]);
        return result.rows.map(mapRowToPawnTicket);
    }
}
