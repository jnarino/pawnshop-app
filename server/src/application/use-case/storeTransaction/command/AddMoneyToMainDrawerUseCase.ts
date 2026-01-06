import crypto from 'crypto';
import { StoreTransaction } from '../../../../domains/storeTransaction/StoreTransaction';
import { StoreTransactionTender } from '../../../../domains/storeTransaction/StoreTransactionTender';
import { StoreTransactionRepository } from '../../../../domains/storeTransaction/StoreTransactionRepository';
import { TenderTypeRepository } from '../../../../domains/tenderType/TenderTypeRepository';
import { ValidationError } from '../../../common/errors';
import {
  addMoneyToMainDrawerRequestSchema,
  AddMoneyToMainDrawerRequestDto
} from '../../../dto/storeTransaction/command/AddMoneyToMainDrawerRequestDto';

const WITHDRAWAL_FROM_BANK_TYPE_ID = 26; // store_transaction_type: WITHDRAWAL FROM BANK (to drawer)
const CASH_ADDED_MAIN_TYPE_ID = 24; // store_transaction_type: CASH ADDED - MAIN (safe/bank op)
const CASH_TENDER_TYPE_ID = 1; // tender_type: CASH

export class AddMoneyToMainDrawerUseCase {
  constructor(
    private readonly storeTransactionRepository: StoreTransactionRepository,
    private readonly tenderTypeRepository: TenderTypeRepository
  ) {}

  async execute(input: unknown, clerkUserId: string): Promise<StoreTransaction> {
    const dto: AddMoneyToMainDrawerRequestDto = addMoneyToMainDrawerRequestSchema.parse(input);

    // Get all tender types to map name to ID
    const tenderTypes = await this.tenderTypeRepository.findAllActive();
    const tenderType = tenderTypes.find(
      tt => tt.name.toUpperCase() === dto.transactionTenderName.toUpperCase()
    );

    if (!tenderType) {
      throw new ValidationError(`Invalid tender type: ${dto.transactionTenderName}`);
    }

    // Validation: If from bank, must be CASH
    if (dto.isFromBank && tenderType.name.toUpperCase() !== 'CASH') {
      throw new ValidationError(
        `${dto.transactionTenderName} type cannot be added from bank to main drawer`
      );
    }

    const transactionId = crypto.randomUUID();
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const amount = Math.abs(dto.amount); // Positive amount for adding money

    // Determine transaction type based on isFromBank
    const typeId = dto.isFromBank ? WITHDRAWAL_FROM_BANK_TYPE_ID : CASH_ADDED_MAIN_TYPE_ID;

    const tender = new StoreTransactionTender({
      id: crypto.randomUUID(),
      storeTransactionId: transactionId,
      sequence: 1,
      tenderTypeId: tenderType.id,
      amount: amount,
      createdAt: occurredAt
    });

    const tx = new StoreTransaction({
      id: transactionId,
      customerId: null,
      clerkUserId,
      typeId,
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
      createdAt: occurredAt,
      updatedAt: occurredAt
    });

    return this.storeTransactionRepository.create(tx);
  }
}
