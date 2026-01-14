import { CashDrawerRecord } from './CashDrawerRecord';

export interface CashDrawerReportRepository {
  // Returns the last close (MB) amount and timestamp before startDate
  getLastClose(startDate: Date): Promise<{ amount: number; occurredAt: Date } | null>;
  findByDateRange(startDate: Date, endDate: Date): Promise<CashDrawerRecord[]>;
}
