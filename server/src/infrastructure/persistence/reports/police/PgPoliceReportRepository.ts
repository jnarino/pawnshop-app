
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

                const karatText: string = row.karat || '';
                const parsedKarat = this.parseKaratToNumber(karatText);

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
                    customerRace: row.race || '',
                    customerAddress: row.street_address || '',
                    customerCity: row.city || '',
                    customerState: row.state_us || '',
                    customerZip: row.zip_code || '',
                    customerPhone: row.phone_number || '',
                    customerEmployer: row.employer_name || '',
                    // Combine state + type to match export (e.g., "FL DRIVERS")
                    customerIdType: [row.id_state, row.id_type].filter(Boolean).join(' ') || '',
                    customerIdNumber: row.id_number || '',

                    customerHeight: row.height || '',
                    customerWeight: row.weight || 0,
                    customerHairColor: row.hair_color || '',
                    customerEyeColor: row.eye_color || '',

                    itemType: row.subcategory_name || '',
                    itemBrand: row.brand_name || '',
                    itemDescription: row.item_description || '',
                    itemMetalType: row.metal_color || '',
                    itemKarat: parsedKarat,
                    itemWeight: row.weight || 0,
                    itemSize: row.sizelength || '',
                    itemQuantity: row.quantity || 0,
                    itemAmount: row.price_amount || 0,
                    itemStatus: '',
                    recordType: 'J',

                    serialNumber: row.serial_number || '',
                    ownerMark: row.owner_mark || '',
                    model: row.model || '',
                    subcategoryInitial: row.subcategory_initial || '',
                    metalColor: row.metal_color || '',
                    stoneShape: row.shape_id || '',
                    stoneColor: row.color || '',

                    username: row.username || '',

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

    private parseKaratToNumber(karatText: string): number {
        if (!karatText) return 0;
        const t = karatText.toUpperCase().trim();
        // Sterling silver .925 -> 0.93
        const silver = t.match(/0?\.?(\d{2,3})/);
        if (t.includes('.925') || t === '.925' || t.includes('925')) {
            return 0.93;
        }
        // e.g., 10K, 10KT, 14K, 18KT
        const kt = t.match(/(\d{1,2})\s*K(T)?/);
        if (kt) {
            return parseFloat(kt[1]);
        }
        const num = parseFloat(t);
        return isNaN(num) ? 0 : num;
    }
}
