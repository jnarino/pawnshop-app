import crypto from 'crypto';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import {
  removeCashFromMainDrawerRequestSchema,
  RemoveCashFromMainDrawerRequestDto
} from '../../../dto/storeTransaction/command/RemoveCashFromMainDrawerRequestDto';

const MAIN_DRAWER_CASH_OUT_TYPE_ID = 25; // store_transaction_type: CASH OUT - MAIN (from drawer to main)
const CASH_TENDER_TYPE_ID = 1; // tender_type: CASH

export class RemoveCashFromMainDrawerUseCase {
  constructor(private readonly storeTransactionRepository: StoreTransactionRepository) {}

  async execute(input: unknown, clerkUserId: string): Promise<StoreTransaction> {
    const dto: RemoveCashFromMainDrawerRequestDto = removeCashFromMainDrawerRequestSchema.parse(input);

    const transactionId = crypto.randomUUID();
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const amount = -Math.abs(dto.amount);

    const tender = new StoreTransactionTender({
      id: crypto.randomUUID(),
      storeTransactionId: transactionId,
      sequence: 1,
      tenderTypeId: CASH_TENDER_TYPE_ID,
      amount: amount,
      createdAt: new Date()
    });

    const tx = new StoreTransaction({
      id: transactionId,
      customerId: null,
      clerkUserId,
      typeId: MAIN_DRAWER_CASH_OUT_TYPE_ID,
      occurredAt,
      amount,
      taxSales: null,
      stateTax: null,
      taxExemptUsed: false,
      tenderChange: 0,
      gunProcFee: null,
      note: dto.note ?? null,
      tenders: [tender],
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return this.storeTransactionRepository.create(tx);
  }
}