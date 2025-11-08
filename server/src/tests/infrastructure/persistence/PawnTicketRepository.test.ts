import { Pool, PoolClient } from 'pg';
import { CreatePawnTicketInput, PawnTicket } from '../../../domain/pawnTicket/PawnTicket';
import { pool } from '../../../infrastructure/persistence/db';

export class PawnTicketRepository {
    // ...existing methods...

    async createSingleTicket(input: CreatePawnTicketInput): Promise<string> {
        const client = await pool.connect();
        try {
            const { rows } = await client.query(
                `INSERT INTO pawn_ticket (type, customer_id, inventory_item_ids, amount_financed, periodic_rate, transaction_date, maturity_date, default_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id`,
                [
                    input.type,
                    input.customerId,
                    input.inventoryItemIds,
                    input.amountFinanced,
                    input.periodicRate,
                    input.transactionDate,
                    input.maturityDate,
                    input.defaultDate,
                ]
            );
            return rows[0].id;
        } finally {
            client.release();
        }
    }

    async createInTransaction(client: PoolClient, input: CreatePawnTicketInput): Promise<string> {
        const { rows } = await client.query(
            `INSERT INTO pawn_ticket (type, customer_id, inventory_item_ids, amount_financed, periodic_rate, transaction_date, maturity_date, default_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id`,
            [
                input.type,
                input.customerId,
                input.inventoryItemIds,
                input.amountFinanced,
                input.periodicRate,
                input.transactionDate,
                input.maturityDate,
                input.defaultDate,
            ]
        );
        return rows[0].id;
    }

    // ...existing methods...
}