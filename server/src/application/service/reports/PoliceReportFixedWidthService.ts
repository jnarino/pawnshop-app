import { PoliceReport } from '../../../domains/reports/police/PoliceReport';

export class PoliceReportFixedWidthService {
    toFixedWidth(reports: PoliceReport[]): string {
        return reports.map((report) => this.formatLine(report)).join('\n');
    }

    private formatLine(report: PoliceReport): string {
        const transactionDate = report.transactionDate ?? report.holdDate;
        const datePart = this.formatDate(transactionDate);
        const timePart = this.formatTime(transactionDate);

        const parts = [
            this.pad(report.controlNumber, 7, 'right'),
            this.pad(report.storeName, 32),
            this.pad(report.storeAddress, 27),
            this.pad(report.storeCity, 20),
            this.pad(`${report.storeState}${report.storeZip ?? ''}`, 10),
            this.pad(report.storePhone, 16),
            `${datePart}${timePart}`,
            (report.transactionType || 'P').slice(0, 1).toUpperCase(),
            this.pad(report.customerFirstName, 13),
            this.pad(report.customerMiddleName, 14),
            this.pad(report.customerLastName, 22),
            this.pad(this.formatDate(report.customerDob), 8),
            (report.customerGender || '').toUpperCase().padEnd(2, ' '),
            this.pad(report.customerAddress, 27),
            this.pad(report.customerCity, 20),
            this.pad(report.customerState, 2),
            this.pad(report.customerZip, 10),
            this.pad(report.customerPhone, 14),
            this.pad(report.customerEmployer, 35),
            this.pad(report.customerIdNumber, 15),
            this.pad(report.customerIdType, 10),
            this.pad(this.formatHeight(report.customerHeight), 6),
            this.pad(this.formatWeight(report.customerWeight), 3, 'right'),
            this.pad(report.customerHairColor, 10),
            this.pad(report.customerEyeColor, 10),
            this.pad(report.itemType, 10),
            this.pad(report.itemBrand, 15),
            this.pad(report.itemDescription, 55),
            this.pad(this.formatCurrency(report.itemAmount), 10, 'right'),
            this.pad(report.recordType || 'J', 2),
        ];

        return parts.join('');
    }

    private pad(value: string | number | null | undefined, length: number, align: 'left' | 'right' = 'left'): string {
        const str = (value ?? '').toString().slice(0, length);
        return align === 'right' ? str.padStart(length, ' ') : str.padEnd(length, ' ');
    }

    private formatDate(value: Date | string | null | undefined): string {
        if (!value) return ''.padEnd(8, ' ');
        const date = value instanceof Date ? value : new Date(value);
        const year = date.getFullYear().toString().padStart(4, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    private formatTime(value: Date | string | null | undefined): string {
        if (!value) return ''.padEnd(8, '0');
        const date = value instanceof Date ? value : new Date(value);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    private formatHeight(value: string | null | undefined): string {
        if (!value) return ''.padEnd(6, ' ');
        const clean = value.replace(/[^0-9'".]/g, '');
        return clean.slice(0, 6).padEnd(6, ' ');
    }

    private formatWeight(value: number | string | null | undefined): string {
        if (value === null || value === undefined) return ''.padEnd(3, ' ');
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return Math.round(num).toString().padStart(3, ' ');
    }

    private formatCurrency(value: number | string | null | undefined): string {
        if (value === null || value === undefined) return ''.padStart(10, ' ');
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toFixed(2).padStart(10, ' ');
    }
}
