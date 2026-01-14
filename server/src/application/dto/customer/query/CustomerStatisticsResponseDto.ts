export interface CustomerStatisticsResponseDto {
  customerId: string;
  customerName: string;
  
  // Counts
  activePawns: number;
  redeemedPawns: number;
  defaultedPawns: number;
  buys: number;
  
  // Percentages
  redemptionRatio: number;  // percentage (0-100) = redeemed / total pawns
  defaultRatio: number;     // percentage (0-100) = defaulted / total pawns

  // Financial
  totalSalesAmount: number;
}
