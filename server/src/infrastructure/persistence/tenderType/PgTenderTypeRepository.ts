import { Pool } from 'pg';
import { TenderType } from '../../../domains/tenderType/TenderType';
import { TenderTypeRepository } from '../../../domains/tenderType/TenderTypeRepository';

export class PgTenderTypeRepository implements TenderTypeRepository {
    constructor(private pool: Pool) { }

    async findAllActive(): Promise<TenderType[]> {
        const result = await this.pool.query(
            `SELECT id, name, legacy_code, active 
       FROM tender_type 
       WHERE active = true 
       ORDER BY name ASC`
        );

        return result.rows.map(row => new TenderType(
            row.id,
            row.name,
            row.legacy_code,
            row.active
        ));
    }
}
