
import crypto from 'crypto';
import { Pool } from 'pg';
import { PoliceReport, PoliceReportProps } from '../../../../domains/reports/police/PoliceReport';
import { PoliceReportRepository, FindPoliceReportsCriteria } from '../../../../domains/reports/police/PoliceReportRepository';
import { loadSql } from '../../../db/sqlLoader';

const sqlDailyReport = loadSql('queries', 'reports/police/police_daily_records_report');

export class PgPoliceReportRepository implements PoliceReportRepository {
    constructor(private readonly pool: Pool) { }

    async findByCriteria(criteria: FindPoliceReportsCriteria): Promise<PoliceReport[]> {
        const limit = criteria.limit ?? 5000;
        const offset = criteria.offset ?? 0;
        const startDate = criteria.startDate ?? new Date('1970-01-01');
        const endDate = criteria.endDate ?? new Date();

        const result = await this.pool.query(sqlDailyReport, [
            startDate,
            endDate,
            null, // control number filter not used here
            limit,
            offset,
        ]);

        return this.mapRowsToReports(result.rows);
    }

    async findByControlNumber(controlNumber: string): Promise<PoliceReport | null> {
        const startDate = new Date('1970-01-01');
        const endDate = new Date();

        const result = await this.pool.query(sqlDailyReport, [
            startDate,
            endDate,
            controlNumber,
            1,
            0,
        ]);

        if (result.rowCount === 0) return null;

        const reports = this.mapRowsToReports(result.rows);
        return reports.length > 0 ? reports[0] : null;
    }

    // Legacy interface methods retained but return empty data for non-hold flow
    async findActiveHolds(): Promise<PoliceReport[]> {
        return [];
    }

    async findByAgency(): Promise<PoliceReport[]> {
        return [];
    }

    async create(report: PoliceReport): Promise<PoliceReport> {
        return report;
    }

    async countHolds(): Promise<number> {
        return 0;
    }

    private mapRowsToReports(rows: any[]): PoliceReport[] {
        // Group rows by control_number since multiple items can be in one transaction
        const groupedByControl = new Map<string, any[]>();

        rows.forEach((row) => {
            const key = row.control_number;
            if (!groupedByControl.has(key)) {
                groupedByControl.set(key, []);
            }
            groupedByControl.get(key)!.push(row);
        });

        const reports: PoliceReport[] = [];

        groupedByControl.forEach((itemRows) => {
            // Use first row for common fields, items might differ
            itemRows.forEach((row) => {
                const transactionDate = row.transaction_date ? new Date(row.transaction_date) : new Date();
                const transactionTime = transactionDate.toTimeString().substring(0, 8);

                const props: PoliceReportProps = {
                    id: crypto.randomUUID(),
                    controlNumber: row.control_number || '',
                    storeName: 'LARRY\'S ESTATE JEWELRY & PAWN', // From config or database
                    storeAddress: '3316 CLEVELAND AVE.',
                    storeCity: 'FORT MYERS',
                    storeState: 'FL',
                    storeZip: '33901-',
                    storePhone: '(239) 939-3633',

                    transactionDate,
                    transactionTime,
                    transactionType: (row.transaction_type || 'P') as 'P' | 'B' | 'L',

                    customerFirstName: row.first_name || '',
                    customerMiddleName: row.middle_name || '',
                    customerLastName: row.last_name || '',
                    customerDob: row.date_of_birth ? new Date(row.date_of_birth) : new Date(),
                    customerGender: row.gender || '',
                    customerAddress: row.customer_address || '',
                    customerCity: row.customer_city || '',
                    customerState: row.customer_state || '',
                    customerZip: row.customer_zip || '',
                    customerPhone: row.customer_phone || '',
                    customerEmployer: row.customer_employer || '',
                    customerIdType: row.customer_id_type || '',
                    customerIdNumber: row.customer_id_number || '',

                    customerHeight: row.customer_height || '',
                    customerWeight: row.customer_weight || 0,
                    customerHairColor: row.customer_hair_color || '',
                    customerEyeColor: row.customer_eye_color || '',

                    itemType: row.item_type || '',
                    itemBrand: row.item_brand || '',
                    itemDescription: row.item_description || '',
                    itemMetalType: '', // Would need additional info
                    itemKarat: 0, // Would need additional info
                    itemWeight: 0, // Would need additional info
                    itemSize: '', // Would need additional info
                    itemQuantity: row.quantity || 0,
                    itemAmount: row.item_amount || 0,
                    itemStatus: row.item_status || '',
                    recordType: row.record_type || 'J',

                    holdDate: transactionDate,
                    holdAgency: '',
                    holdCaseNumber: '',
                    holdDateOut: null,

                    reportDate: new Date(),
                    reportGeneratedAt: new Date(),
                    generatedBy: 'system',

                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                reports.push(new PoliceReport(props));
            });
        });

        return reports;
    }
}
