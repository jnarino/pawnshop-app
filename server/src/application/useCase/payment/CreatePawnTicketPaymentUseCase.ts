import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../../../infrastructure/db';
import { v4 as uuidv4 } from 'uuid';
import type { PoolClient } from 'pg';

interface TenderInput {
  type: string;    // 'CASH', 'VISA', etc.
  amount: number;
}

interface PawnTicketPaymentInput {
  pawnTicketId: string;
  paymentType: 'redemption' | 'partial';
  interestPaid: number;
  principalPaid: number;
  totalAmount: number;
  note?: string;
}

interface CreatePaymentInput {
  customerId: string;
  totalAmount: number;
  tenders: TenderInput[];
  pawnTicketPayments: PawnTicketPaymentInput[];
}

export class CreatePawnTicketPaymentUseCase {
  async execute(input: CreatePaymentInput) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      console.log('[CreatePawnTicketPayment] Starting payment transaction');

      // 1. Create store transaction (header)
      const storeTransactionId = uuidv4();
      const createTransactionSql = readFileSync(
        join(__dirname, '../../../infrastructure/db/query/payment/createStoreTransaction.sql'),
        'utf-8'
      );

      await client.query(createTransactionSql, [
        storeTransactionId,
        input.customerId,
        null, // clerk_user_id - TODO: get from auth context
        3, // PAWN_PAYMENT type
        input.totalAmount,
        `Payment for ${input.pawnTicketPayments.length} pawn ticket(s)`
      ]);

      // 2. Create tender records
      const createTenderSql = readFileSync(
        join(__dirname, '../../../infrastructure/db/query/payment/createStoreTransactionTender.sql'),
        'utf-8'
      );

      for (let i = 0; i < input.tenders.length; i++) {
        const tender = input.tenders[i];
        const tenderTypeId = this.getTenderTypeId(tender.type);
        
        await client.query(createTenderSql, [
          uuidv4(),
          storeTransactionId,
          i + 1,
          tenderTypeId,
          tender.amount
        ]);
      }

      // 3. Create pawn ticket payment records
      const createPaymentSql = readFileSync(
        join(__dirname, '../../../infrastructure/db/query/payment/createPawnTicketPayment.sql'),
        'utf-8'
      );

      const paymentIds = [];
      for (const pawnPayment of input.pawnTicketPayments) {
        const paymentId = uuidv4();
        
        await client.query(createPaymentSql, [
          paymentId,
          pawnPayment.pawnTicketId,
          storeTransactionId,
          pawnPayment.interestPaid,
          pawnPayment.principalPaid,
          0, // fees_paid
          pawnPayment.note
        ]);

        paymentIds.push(paymentId);

        // 4. Update pawn ticket status
        const updateTicketSql = pawnPayment.paymentType === 'redemption' 
          ? readFileSync(join(__dirname, '../../../infrastructure/db/query/payment/updatePawnTicketRedeemed.sql'), 'utf-8')
          : readFileSync(join(__dirname, '../../../infrastructure/db/query/payment/updatePawnTicketPartialPayment.sql'), 'utf-8');
          
        await client.query(updateTicketSql, [pawnPayment.pawnTicketId]);
      }

      await client.query('COMMIT');

      console.log('[CreatePawnTicketPayment] Payment transaction completed:', {
        transactionId: storeTransactionId,
        paymentIds,
        totalAmount: input.totalAmount
      });

      return {
        transactionId: storeTransactionId,
        paymentId: paymentIds[0],
        paymentIds
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[CreatePawnTicketPayment] Transaction failed:', error);
      throw new Error(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  private getTenderTypeId(tenderType: string): number {
    const tenderMap: Record<string, number> = {
      'CASH': 1,
      'AMERICAN EXPRESS': 2,
      'DEBIT': 3,
      'DISCOVER': 4,
      'MASTER CARD': 5,
      'VISA': 6,
      'CHECK': 7,
      'CASH PASS': 8
    };

    return tenderMap[tenderType] || 1; // Default to CASH
  }
}
