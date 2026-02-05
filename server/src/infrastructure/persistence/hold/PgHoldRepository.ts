import { Pool, PoolClient } from 'pg';
import { loadSql } from '../../db/sqlLoader';
import { HoldRepository, HoldCriteria } from '../../../domains/hold/HoldRepository';
import { HoldItem } from '../../../domains/hold/HoldItem';

const SQL_LIST = loadSql('queries', 'hold/hold_item_list');
const SQL_CREATE = loadSql('commands', 'hold/hold_item_create');
const SQL_CREATE_ITEM = loadSql('commands', 'hold/hold_item_inventory_create');

type DbClient = Pool | PoolClient;

import crypto from 'crypto';

export class PgHoldRepository implements HoldRepository {
  constructor(private readonly pool: DbClient) {}

  async create(hold: HoldItem, inventoryItemIds: string[]): Promise<HoldItem> {
    // 1. Create Hold
    const res = await this.pool.query(SQL_CREATE, [
      hold.id,
      hold.controlNumber,
      // customer_id ignored in SQL
      hold.holdDate,
      hold.agency,
      hold.caseNumber,
      // date_out ignored
      hold.isHold,
      hold.isInventory,
      hold.comment,
      hold.agentLastName,
      hold.agentFirstName,
      hold.agentMiddleInitial,
      hold.badgeNumber,
      hold.phoneAreaCode,
      hold.phoneNumber,
      hold.phoneExtension,
      hold.jurisdiction
    ]);
    const row = res.rows[0];

    // 2. Link Items
    for (const itemId of inventoryItemIds) {
      await this.pool.query(SQL_CREATE_ITEM, [
        crypto.randomUUID(), // Assuming I can use crypto or need to pass ID
        hold.id,
        itemId
      ]);
    }

    // Return mapped entity (simplified for now as we just created it)
    // In a real app we might want to refetch or construct from row
    return new HoldItem({
       ...hold,
       createdAt: row.created_at,
       updatedAt: row.updated_at
    });
  }

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
