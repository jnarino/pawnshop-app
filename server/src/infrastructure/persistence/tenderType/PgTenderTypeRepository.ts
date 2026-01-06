import { Pool } from 'pg';
import { TenderType } from '../../../domains/tenderType/TenderType';
import { TenderTypeRepository } from '../../../domains/tenderType/TenderTypeRepository';
import { loadSql } from '../../db/sqlLoader';

export class PgTenderTypeRepository implements TenderTypeRepository {
    constructor(private pool: Pool) { }

    async findAllActive(): Promise<TenderType[]> {
        const sql = loadSql('queries', 'tenderType/tender_type_find_all_active');
        const result = await this.pool.query(sql);
        return result.rows.map(row => new TenderType(
            row.id,
            row.name,
            row.legacy_code,
            row.active
        ));
    }
}
