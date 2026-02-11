import { SalesTaxRecord } from './SalesTaxRecord';

export interface SalesTaxReportRepository {
  findByDateRange(startDate: Date, endDate: Date): Promise<SalesTaxRecord[]>;
}
