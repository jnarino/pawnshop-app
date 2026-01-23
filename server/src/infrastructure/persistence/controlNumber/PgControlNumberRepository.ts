import { Pool, PoolClient } from 'pg';
import { ControlNumberRepository } from '../../../domains/controlNumber/ControlNumberRepository';

type DbClient = Pool | PoolClient;

export class PgControlNumberRepository implements ControlNumberRepository {
    constructor(private readonly db: DbClient) { }

    async getNextPawnControlNumber(): Promise<string> {
        const result = await this.db.query('SELECT get_next_pawn_control_number() AS control_number');
        return result.rows[0].control_number;
    }

    async getNextPurchaseControlNumber(): Promise<string> {
        const result = await this.db.query('SELECT get_next_purchase_control_number() AS control_number');
        return result.rows[0].control_number;
    }

    async getNextStoreSaleControlNumber(): Promise<string> {
        const result = await this.db.query('SELECT get_next_store_sale_control_number() AS control_number');
        return result.rows[0].control_number;
    }
}
