import { CashDrawerRecord } from './CashDrawerRecord';

export interface CashDrawerReportRepository {
  getOpeningBalance(startDate: Date): Promise<number>;
  findByDateRange(startDate: Date, endDate: Date): Promise<CashDrawerRecord[]>;
}
