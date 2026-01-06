
import crypto from 'crypto';
import { Pool } from 'pg';
import { PoliceReport, PoliceReportProps } from '../../../../domains/reports/police/PoliceReport';
import { PoliceReportRepository, FindPoliceReportsCriteria } from '../../../../domains/reports/police/PoliceReportRepository';
import { loadSql } from '../../../db/sqlLoader';

const sqlDailyReport = loadSql('queries', 'reports/police/police_daily_records_report');

export class PgPoliceReportRepository implements PoliceReportRepository {
    constructor(private readonly pool: Pool) { }

    async findByCriteria(criteria: FindPoliceReportsCriteria): Promise<PoliceReport[]> {
        const startDate = criteria.startDate ?? new Date();
        const endDate = criteria.endDate ?? new Date();

        const result = await this.pool.query(sqlDailyReport, [
            startDate,
            endDate,
        ]);

        return this.mapRowsToReports(result.rows);
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
                    storeAddress: '1726 CAPE CORAL PKWY',
                    storeCity: 'CAPE CORAL',
                    storeState: 'FL',
                    storeZip: '33904',
                    storePhone: '(239) 594-8881',
                    transactionDate,
                    transactionTime,
                    transactionType: (row.transaction_type || 'P') as 'P' | 'B' | 'L',

                    customerFirstName: row.first_name || '',
                    customerMiddleName: row.middle_name || '',
                    customerLastName: row.last_name || '',
                    customerDob: row.date_of_birth ? new Date(row.date_of_birth) : new Date(),
                    customerGender: row.sex || '',
                    customerAddress: row.street_address || '',
                    customerCity: row.city || '',
                    customerState: row.state_us || '',
                    customerZip: row.zip_code || '',
                    customerPhone: row.phone_number || '',
                    customerEmployer: row.employer_name || '',
                    customerIdType: row.id_type || '',
                    customerIdNumber: row.id_number || '',

                    customerHeight: row.height || '',
                    customerWeight: row.weight || 0,
                    customerHairColor: row.hair_color || '',
                    customerEyeColor: row.eye_color || '',

                    itemType: row.subcategory_name || '',
                    itemBrand: row.brand_name || '',
                    itemDescription: row.item_description || '',
                    itemMetalType: '', // Would need additional info
                    itemKarat: 0, // Would need additional info
                    itemWeight: 0, // Would need additional info
                    itemSize: '', // Would need additional info
                    itemQuantity: 0,
                    itemAmount: 0,
                    itemStatus: '',
                    recordType: 'J',

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
