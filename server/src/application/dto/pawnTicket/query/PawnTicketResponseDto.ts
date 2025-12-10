export type PawnTransactionTypeDto = 'PAWN' | 'PURCHASE';

export type PawnStatusDto =
  | 'active'
  | 'redeemed'
  | 'defaulted'
  | 'police hold'
  | 'confiscation'
  | 'voided';

export interface PawnTicketResponseDto {
  id: string;
  controlNumber: string;
  transactionType: PawnTransactionTypeDto;
  customerId: string;

  amountFinanced: number | null;
  purchaseTradeValue: number | null;

  transactionDate: string;
  maturityDate: string;
  defaultDate: string;

  pawnStatus: PawnStatusDto;

  itemIds: string[];
}
