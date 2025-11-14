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

      // ✅ 1. Create store transaction (header)
      const storeTransactionId = uuidv4();
      const createTransactionSql = `
        INSERT INTO store_transaction (
          id, customer_id, clerk_user_id, type_id, occurred_at, 
          amount, note, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, NOW(), NOW())
      `;

      // Use PAWN_PAYMENT type (id = 3 from migrations)
      await client.query(createTransactionSql, [
        storeTransactionId,
        input.customerId,
        null, // clerk_user_id - TODO: get from auth context
        3, // PAWN_PAYMENT type
        input.totalAmount,
        `Payment for ${input.pawnTicketPayments.length} pawn ticket(s)`
      ]);

      // ✅ 2. Create tender records
      for (let i = 0; i < input.tenders.length; i++) {
        const tender = input.tenders[i];
        const tenderTypeId = this.getTenderTypeId(tender.type);
        
        const createTenderSql = `
          INSERT INTO store_transaction_tender (
            id, store_transaction_id, sequence, tender_type_id, amount, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `;

        await client.query(createTenderSql, [
          uuidv4(),
          storeTransactionId,
          i + 1,
          tenderTypeId,
          tender.amount
        ]);
      }

      // ✅ 3. Create pawn ticket payment records
      const paymentIds = [];
      for (const pawnPayment of input.pawnTicketPayments) {
        const paymentId = uuidv4();
        
        const createPaymentSql = `
          INSERT INTO pawn_ticket_payment (
            id, pawn_ticket_id, store_transaction_id, payment_date,
            interest_paid, principal_paid, fees_paid, note, created_at
          ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, NOW())
        `;

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

        // ✅ 4. Update pawn ticket status if full redemption
        if (pawnPayment.paymentType === 'redemption') {
          const updateTicketSql = `
            UPDATE pawn_ticket 
            SET pawn_status = 'redeemed',
                last_payment_at = NOW(),
                last_activity_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
          `;
          await client.query(updateTicketSql, [pawnPayment.pawnTicketId]);
        } else {
          // Update last payment date for partial payments
          const updateTicketSql = `
            UPDATE pawn_ticket 
            SET last_payment_at = NOW(),
                last_activity_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
          `;
          await client.query(updateTicketSql, [pawnPayment.pawnTicketId]);
        }
      }

      await client.query('COMMIT');

      console.log('[CreatePawnTicketPayment] Payment transaction completed:', {
        transactionId: storeTransactionId,
        paymentIds,
        totalAmount: input.totalAmount
      });

      return {
        transactionId: storeTransactionId,
        paymentId: paymentIds[0], // Return first payment ID
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

  // ✅ Map tender types to database IDs
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
