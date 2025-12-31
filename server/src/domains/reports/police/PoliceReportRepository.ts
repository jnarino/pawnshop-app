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
   * Find police reports by date range and agency
   */
  findByCriteria(criteria: FindPoliceReportsCriteria): Promise<PoliceReport[]>;

  /**
   * Find police report by control number
   */
  findByControlNumber(controlNumber: string): Promise<PoliceReport | null>;

  /**
   * Get all active police holds (not yet released)
   */
  findActiveHolds(): Promise<PoliceReport[]>;

  /**
   * Get police holds by agency
   */
  findByAgency(agency: string, limit?: number, offset?: number): Promise<PoliceReport[]>;

  /**
   * Create or save a police report record
   */
  create(report: PoliceReport): Promise<PoliceReport>;

  /**
   * Count total police holds
   */
  countHolds(): Promise<number>;
}
