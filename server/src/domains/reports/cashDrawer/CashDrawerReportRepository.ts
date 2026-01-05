import { CashDrawerRecord } from './CashDrawerRecord';

export interface CashDrawerReportRepository {
  findByDateRange(startDate: Date, endDate: Date): Promise<CashDrawerRecord[]>;
}
