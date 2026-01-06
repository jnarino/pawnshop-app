import { z } from 'zod';

export const listBalanceCashDrawerRequestSchema = z.object({
  asOfDate: z.string().datetime().optional()
});

export type ListBalanceCashDrawerRequestDto = z.infer<typeof listBalanceCashDrawerRequestSchema>;

export type MainDrawerBalance = {
  /**
   * Current cash balance (last close balance + all CASH activity since)
   */
  CASH: number;
  /**
   * Total AMERICAN EXPRESS activity since last close
   */
  'AMERICAN EXPRESS': number;
  /**
   * Total DEBIT activity since last close
   */
  DEBIT: number;
  /**
   * Total DISCOVER activity since last close
   */
  DISCOVER: number;
  /**
   * Total MASTER CARD activity since last close
   */
  'MASTER CARD': number;
  /**
   * Total VISA activity since last close
   */
  VISA: number;
  /**
   * Total CHECK activity since last close
   */
  CHECK: number;
  /**
   * Total CASH PASS activity since last close
   */
  'CASH PASS': number;
};

export type CashDrawerBalanceResponseDto = {
  lastCloseOccurredAt: string | null;
  lastCloseBalance: number;
  currentBalance: number;
  mainDrawerBalance: MainDrawerBalance;
  asOf: string;
};
