import { InventoryItemResponseDto } from '../../inventory/InventoryItemResponseDto';

export type PawnTransactionTypeDto = 'PAWN' | 'PURCHASE';

export type PawnStatusDto =
  | 'P'   // Pawn (active pawn)
  | 'U'   // Redeemed
  | 'D'   // Defaulted
  | 'H'   // Police Hold
  | 'C'   // Confiscation
  | 'V'   // Voided
  | 'B';  // Buy (purchase transaction)

export interface TenderInfoDto {
  tenderTypeId: number;
  amount: number;
}

export interface PawnTicketResponseDto {
  id: string;
  controlNumber: string;
  transactionType: PawnTransactionTypeDto;
  customerId: string;
  clerkUserId: string;

  amountFinanced: number | null;
  financeCharge: number | null;
  periodicRate: number | null;
  totalOfPayments: number | null;
  apr: number | null;
  ratePlanId: string | null;

  purchaseTradeValue: number | null;

  transactionDate: string;
  maturityDate: string;
  defaultDate: string;
  createdDate: string;

  pawnStatus: PawnStatusDto;

  items: InventoryItemResponseDto[];
  tenders: TenderInfoDto[];
  note?: string;
}
