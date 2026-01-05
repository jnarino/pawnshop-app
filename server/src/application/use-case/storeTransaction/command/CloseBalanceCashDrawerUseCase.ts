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

// Tender type mapping
const TENDER_MAP = {
  cash: 1,
  americanExpress: 2,
  debit: 3,
  discover: 4,
  masterCard: 5,
  visa: 6,
  check: 7,
  cashPass: 8
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
    const createdTransactions: StoreTransaction[] = [];

    // 1. Create DEPOSIT FROM MAIN transactions (type 22) for each tender with amount
    const tenderEntries = Object.entries(dto.tenderAmounts) as Array<[keyof typeof TENDER_MAP, number | undefined]>;
    
    for (const [tenderKey, amount] of tenderEntries) {
      if (amount && amount !== 0) {
        const tenderTypeId = TENDER_MAP[tenderKey];
        
        // Create transaction with negative amount (depositing to main)
        const transaction = new StoreTransaction({
          id: crypto.randomUUID(),
          customerId: null,
          clerkUserId,
          typeId: TYPE_DEPOSIT_FROM_MAIN,
          occurredAt,
          amount: -Math.abs(amount), // Force negative
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
              storeTransactionId: '',
              tenderTypeId,
              amount: -Math.abs(amount),
              createdAt: occurredAt
            })
          ],
          items: []
        });

        const created = await this.storeTransactionRepo.create(transaction);
        createdTransactions.push(created);
      }
    }

    // 2. Create MAIN BALANCE transaction (type 23) with cash balance
    const balanceTransaction = new StoreTransaction({
      id: crypto.randomUUID(),
      customerId: null,
      clerkUserId,
      typeId: TYPE_MAIN_BALANCE,
      occurredAt,
      amount: dto.cashBalance,
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

