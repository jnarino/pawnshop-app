import { Pool } from 'pg';
import { loadSql } from '../../db/sqlLoader';
import { HoldRepository, HoldCriteria } from '../../../domains/hold/HoldRepository';
import { HoldItem } from '../../../domains/hold/HoldItem';

const SQL_LIST = loadSql('queries', 'hold/hold_item_list');

export class PgHoldRepository implements HoldRepository {
  constructor(private readonly pool: Pool) {}

  async findList(criteria: HoldCriteria): Promise<HoldItem[]> {
    const params = [
      criteria.controlNumber || null,
      criteria.caseNumber || null,
      criteria.inventoryNumber || null,
      criteria.jurisdiction || null,
      criteria.agency || null
    ];

    const result = await this.pool.query(SQL_LIST, params);
    
    return result.rows.map(row => new HoldItem({
      id: row.id,
      controlNumber: row.control_number,
      customerId: row.customer_id,
      holdDate: row.hold_date,
      agency: row.agency,
      caseNumber: row.case_number,
      dateOut: row.date_out,
      isHold: row.is_hold,
      isInventory: row.is_inventory,
      comment: row.comment,
      agentLastName: row.agent_last_name,
      agentFirstName: row.agent_first_name,
      agentMiddleInitial: row.agent_middle_initial,
      badgeNumber: row.badge_number,
      phoneAreaCode: row.phone_area_code,
      phoneNumber: row.phone_number,
      phoneExtension: row.phone_extension,
      jurisdiction: row.jurisdiction,
      legacyHcnId: row.legacy_hcn_id,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: row.items
    }));
  }
}
