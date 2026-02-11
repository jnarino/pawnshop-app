export type SalesTaxRowResponseDto = {
  date: string;
  type: string;
  ticketNumber: string | null;
  grossAmount: number;
  taxableAmount: number;
  taxCollected: number;
};
