import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { v4 as uuidv4 } from 'uuid';
import type { PoolClient } from 'pg';

export interface CreateDisbursementInput {
  customerId: string;
  clerkUserId?: string;
  amount: number;
  note: string;
  controlNumber: string;
  tenders: Array<{ tenderTypeId: number; amount: number }>;
  occurredAt: Date;
}

export interface StoreTransaction {
  id: string;
  customerId: string;
  amount: number;
  note: string;
  occurredAt: string;
}

export class StoreTransactionRepository {
  async createDisbursement(client: PoolClient, input: CreateDisbursementInput): Promise<StoreTransaction> {
    // Get PAWN_DISBURSEMENT transaction type
    const typeResult = await client.query(
      getSQL('query', 'storeTransaction', 'getTransactionTypeByCode'),
      ['PAWN_DISBURSEMENT']
    );
    
    if (typeResult.rows.length === 0) {
      throw new Error('PAWN_DISBURSEMENT transaction type not found');
    }
    
    const typeId = typeResult.rows[0].id;
    const storeTransactionId = uuidv4();
    
    // Create store transaction
    const { rows } = await client.query(
      getSQL('command', 'storeTransaction', 'createStoreTransaction'),
      [
        storeTransactionId,
        input.customerId,
        input.clerkUserId,
        typeId,
        input.occurredAt,
        input.amount,
        input.note,
        input.controlNumber
      ]
    );

    // Add tender splits
    for (let i = 0; i < input.tenders.length; i++) {
      const tender = input.tenders[i];
      await client.query(
        getSQL('command', 'storeTransaction', 'createTender'),
        [uuidv4(), storeTransactionId, i + 1, tender.tenderTypeId, tender.amount]
      );
    }

    return {
      id: rows[0].id,
      customerId: input.customerId,
      amount: input.amount,
      note: input.note,
      occurredAt: input.occurredAt.toISOString()
    };
  }
}
