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
  customer: {
    firstName: string;
    lastName: string;
  };
  clerkUserId: string;
  clerkUsername: string;

  itemIds: string[];

  amountFinanced: number | null;
  originalPawnAmount: number | null;
  periodicRate: number | null;
  apr: number | null;
  purchaseTradeValue: number | null;

  transactionDate: string;
  maturityDate: string;
  defaultDate: string;
  createdDate: string;

  pawnStatus: PawnStatusDto;

  items: InventoryItemResponseDto[];
  note?: string;
  currentCharges?: number | null;
  periodsBehind?: number | null;
  redemptionAmount?: number | null;
}
