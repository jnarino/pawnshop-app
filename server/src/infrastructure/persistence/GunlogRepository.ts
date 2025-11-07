import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { v4 as uuidv4 } from 'uuid';
import type { PoolClient } from 'pg';

export interface CreateAcquisitionEntryInput {
  inventoryItemId: string;
  customerId: string;
  storeTransactionId: string;
  acquisitionDate: Date;
  item: any; // inventory item data
}

export class GunlogRepository {
  async createAcquisitionEntry(client: PoolClient, input: CreateAcquisitionEntryInput): Promise<number> {
    // Get next gunlog number
    const numberResult = await client.query(
      getSQL('query', 'gunlog', 'getNextGunlogNumber')
    );
    const gunlogNumber = numberResult.rows[0].next_num;

    // Get customer details for denormalization
    const customerResult = await client.query(
      getSQL('query', 'customer', 'findCustomerById'),
      [input.customerId]
    );
    const customer = customerResult.rows[0];

    if (!customer) {
      throw new Error('Customer not found for gunlog entry');
    }

    const attributes = input.item.attributes || {};
    
    await client.query(
      getSQL('command', 'gunlog', 'createAcquisitionEntry'),
      [
        uuidv4(),
        gunlogNumber,
        input.inventoryItemId,
        input.item.brand || attributes.manufacturer || 'UNKNOWN',
        input.item.model || 'UNKNOWN',
        input.item.serial_number || 'NO SERIAL',
        attributes.caliber || attributes.caliber_gauge || 'UNKNOWN',
        attributes.firearm_type || attributes.type || 'UNKNOWN',
        attributes.firearm_action || attributes.action || 'UNKNOWN',
        input.acquisitionDate,
        input.customerId,
        `${customer.first_name} ${customer.last_name}`,
        customer.street_address,
        customer.suite_number,
        customer.city,
        customer.state_us,
        customer.zip_code,
        customer.id_type,
        customer.id_number,
        input.storeTransactionId,
        'active'
      ]
    );

    return gunlogNumber;
  }

  async isFirearmCategory(categoryId: string): Promise<boolean> {
    const result = await pool.query(
      getSQL('query', 'gunlog', 'checkFirearmCategory'),
      [categoryId]
    );
    return result.rows[0]?.is_firearm || false;
  }
}
