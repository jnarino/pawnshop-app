import { PoliceReport } from './PoliceReport';

export interface FindPoliceReportsCriteria {
  startDate?: Date;
  endDate?: Date;
  agency?: string;
  storeName?: string;
  limit?: number;
  offset?: number;
}

export interface PoliceReportRepository {
  /**
   * Find police reports by date range
   */
  findByCriteria(criteria: FindPoliceReportsCriteria): Promise<PoliceReport[]>;
}
