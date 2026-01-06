import crypto from 'crypto';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { TenderTypeRepository } from '../../../../domains/tenderType/TenderTypeRepository';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import {
  closeBalanceCashDrawerRequestSchema,
  CloseBalanceCashDrawerRequestDto
} from '../../../dto/storeTransaction/command/CloseBalanceCashDrawerRequestDto';
import { toStoreTransactionResponseDto } from '../../../mapping/storeTransaction/storeTransactionMapper';
import { StoreTransactionResponseDto } from '../../../dto/storeTransaction/query/StoreTransactionResponseDto';
import { ValidationError } from '../../../common/errors';

// Tender type mapping
const TENDER_MAP: Record<string, number> = {
  'CASH': 1,
  'AMERICAN EXPRESS': 2,
  'DEBIT': 3,
  'DISCOVER': 4,
  'MASTER CARD': 5,
  'VISA': 6,
  'CHECK': 7,
  'CASH PASS': 8
};

const TYPE_DEPOSIT_FROM_MAIN = 22;
const TYPE_MAIN_BALANCE = 23;

export class CloseBalanceCashDrawerUseCase {
  constructor(
    private readonly storeTransactionRepo: StoreTransactionRepository,
    private readonly tenderTypeRepo: TenderTypeRepository
  ) {}

  async execute(input: unknown, clerkUserId: string): Promise<StoreTransactionResponseDto[]> {
    const dto: CloseBalanceCashDrawerRequestDto = closeBalanceCashDrawerRequestSchema.parse(input);

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    // 1. Get last MAIN BALANCE and activity since then
    const lastClose = await this.storeTransactionRepo.getLastClose();
    const activity = await this.storeTransactionRepo.getActivitySinceClose();

    // 2. Sum activity by tender type
    const lastCloseBalance = lastClose?.amount ?? 0;
    const activityByTender = new Map<number, number>();
    
    for (const row of activity) {
      if (row.tenderTypeId) {
        const current = activityByTender.get(row.tenderTypeId) || 0;
        activityByTender.set(row.tenderTypeId, current + row.amount);
      }
    }

    // 3. Extract deposits from mainDrawerBalance
    const depositsByTender = new Map<number, number>();
    
    for (const [tenderName, amount] of Object.entries(dto.mainDrawerBalance)) {
      const tenderTypeId = TENDER_MAP[tenderName];
      if (amount > 0) {
        depositsByTender.set(tenderTypeId, amount);
      }
    }

    // 4. RECONCILIATION: For each tender, activity - deposits should = 0
    // For CASH: lastBalance + activity - deposits = 0
    // For others: activity - deposits = 0
    
    // Check CASH reconciliation
    const cashActivity = activityByTender.get(1) || 0;
    const cashDeposit = depositsByTender.get(1) || 0;
    const cashReconcile = lastCloseBalance + cashActivity - cashDeposit;
    
    if (Math.abs(cashReconcile) > 0.01) {
      const offBy = cashReconcile > 0 ? `$${cashReconcile.toFixed(2)} over` : `$${Math.abs(cashReconcile).toFixed(2)} short`;
      throw new ValidationError(
        `CASH reconciliation failed: Last balance $${lastCloseBalance.toFixed(2)} + Activity $${cashActivity.toFixed(2)} - Deposit $${cashDeposit.toFixed(2)} = $${cashReconcile.toFixed(2)} (expected 0). You are ${offBy}.`
      );
    }
    
    // Check non-CASH reconciliation
    for (const [tenderTypeId, depositAmount] of depositsByTender.entries()) {
      if (tenderTypeId === 1) continue; // Skip CASH, already checked
      
      const activityAmount = activityByTender.get(tenderTypeId) || 0;
      const reconciledBalance = activityAmount - depositAmount;
      
      const tenderName = Object.keys(TENDER_MAP).find(k => TENDER_MAP[k] === tenderTypeId) || `Tender ${tenderTypeId}`;
      
      if (Math.abs(reconciledBalance) > 0.01) {
        const offBy = reconciledBalance > 0 ? `$${reconciledBalance.toFixed(2)} over` : `$${Math.abs(reconciledBalance).toFixed(2)} short`;
        throw new ValidationError(
          `${tenderName} reconciliation failed: Activity $${activityAmount.toFixed(2)} - Deposit $${depositAmount.toFixed(2)} = $${reconciledBalance.toFixed(2)} (expected 0). You are ${offBy}.`
        );
      }
    }

    // Also verify that for tenders with no deposits but activity, fail
    for (const [tenderTypeId, activityAmount] of activityByTender.entries()) {
      if (tenderTypeId === 1) continue; // Skip CASH
      
      if (!depositsByTender.has(tenderTypeId) && Math.abs(activityAmount) > 0.01) {
        const tenderName = Object.keys(TENDER_MAP).find(k => TENDER_MAP[k] === tenderTypeId) || `Tender ${tenderTypeId}`;
        throw new ValidationError(
          `${tenderName} has ${activityAmount.toFixed(2)} activity but no deposit recorded`
        );
      }
    }

    // 5. Create DEPOSIT FROM MAIN transactions (negative amounts)
    const createdTransactions: StoreTransaction[] = [];
    
    for (const [tenderTypeId, amount] of depositsByTender.entries()) {
      if (amount > 0) {
        const transactionId = crypto.randomUUID();
        const transaction = new StoreTransaction({
          id: transactionId,
          customerId: null,
          clerkUserId,
          typeId: TYPE_DEPOSIT_FROM_MAIN,
          occurredAt,
          amount: -amount, // Negative for deposit
          taxSales: null,
          taxExemptUsed: false,
          stateTax: null,
          tenderChange: null,
          gunProcFee: null,
          note: dto.note || null,
          createdAt: occurredAt,
          updatedAt: occurredAt,
          tenders: [
            new StoreTransactionTender({
              id: crypto.randomUUID(),
              storeTransactionId: transactionId,
              tenderTypeId,
              amount: -amount,
              createdAt: occurredAt
            })
          ],
          items: []
        });

        const created = await this.storeTransactionRepo.create(transaction);
        createdTransactions.push(created);
      }
    }

    // 6. Create MAIN BALANCE transaction (positive CASH amount)
    const newCashBalance = dto.mainDrawerBalance.CASH;
    
    const balanceTransaction = new StoreTransaction({
      id: crypto.randomUUID(),
      customerId: null,
      clerkUserId,
      typeId: TYPE_MAIN_BALANCE,
      occurredAt,
      amount: newCashBalance,
      taxSales: null,
      taxExemptUsed: false,
      stateTax: null,
      tenderChange: null,
      gunProcFee: null,
      note: dto.note || null,
      createdAt: occurredAt,
      updatedAt: occurredAt,
      tenders: [],
      items: []
    });

    const createdBalance = await this.storeTransactionRepo.create(balanceTransaction);
    createdTransactions.push(createdBalance);

    // Return all created transactions
    return createdTransactions.map(tx => toStoreTransactionResponseDto(tx));
  }
}

