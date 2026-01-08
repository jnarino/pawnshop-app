import { PoliceReport } from '../../../domains/reports/police/PoliceReport';

export class PoliceReportFixedWidthService {
    toFixedWidth(reports: PoliceReport[]): string {
        return reports.map((report) => this.formatLine(report)).join('\n');
    }

    private formatLine(report: PoliceReport): string {
        const txDate = report.transactionDate ?? report.holdDate;
        const datePart = this.formatDate(txDate);
        const timePart = this.formatTime(txDate);

        // Build state+zip blocks
        const storeStateZip = this.pad(report.storeState || '', 2) + this.formatZip(report.storeZip);
        const custStateZip = this.pad(report.customerState || '', 2) + this.formatZip(report.customerZip);

        // Combine ID state + type (e.g., "FL DRIVERS")
        const idTypeFull = report.customerIdType || '';
        
        // Jewelry/material type code (e.g., "RY", "NY", "BY")
        const subcatInitial = (report.subcategoryInitial || this.initial(report.itemType)).toUpperCase();
        const metalInitial = (report.metalColor || '').toUpperCase();
        const typeMetal = this.pad(subcatInitial + metalInitial, 2);
        
        const parts: string[] = [];

        // STORE & TRANSACTION BLOCK
        parts.push(this.pad(report.controlNumber, 6));                    // Control #
        parts.push(this.pad(report.storeName, 32));                       // Store name
        parts.push(this.pad(report.storeAddress, 27));                    // Store address
        parts.push(this.pad(report.storeCity, 20));                       // Store city
        parts.push(storeStateZip);                                         // State+Zip (12 chars: FL33901-    )
        parts.push(this.pad(report.storePhone, 14));                      // Store phone
        parts.push(datePart + timePart);                                   // DateTime (16 chars)
        parts.push((report.transactionType || 'P').toString().slice(0, 1).toUpperCase()); // Type

        // CUSTOMER BLOCK
        parts.push(this.pad(report.customerFirstName, 13));               // First name
        parts.push(this.pad(report.customerMiddleName, 14));              // Middle name
        parts.push(this.pad(report.customerLastName, 22));                // Last name
        parts.push(this.formatDate(report.customerDob));                  // DOB (8)
        parts.push(this.formatSexRace(report.customerGender, report.customerRace)); // Sex+Race (2)
        parts.push(this.pad(report.customerAddress, 27));                 // Address
        parts.push(this.pad(report.customerCity, 20));                    // City
        parts.push(custStateZip);                                          // State+Zip (12)
        parts.push(this.pad(report.customerPhone, 14));                   // Phone
        parts.push(this.pad(report.customerEmployer, 35));                // Employer
        parts.push(this.pad(report.customerEmployer ? `(${report.customerEmployer.slice(0, 3)})` : '(   )', 13)); // Alt phone placeholder
        parts.push(this.pad('', 10));                                      // Spacer
        parts.push(this.pad(report.customerIdNumber, 15));                // ID number
        parts.push(this.pad(idTypeFull, 10));                             // ID type
        parts.push(this.pad(this.formatHeight(report.customerHeight), 6)); // Height
        parts.push(this.formatInteger(report.customerWeight, 3));         // Weight
        parts.push(this.pad(report.customerHairColor, 10));               // Hair
        parts.push(this.pad(report.customerEyeColor, 10));                // Eye

        // ITEM SERIAL/OWNER MARK BLOCK
        parts.push(this.pad(report.serialNumber || '', 50));              // Serial
        parts.push(this.pad(report.ownerMark || '', 20));                 // Owner mark

        // ITEM DESCRIPTION BLOCK
        parts.push(this.pad(report.itemType, 10));                        // Item type
        parts.push(this.pad(report.itemBrand, 20));                       // Brand
        parts.push(this.pad(report.model || '', 20));                     // Model
        parts.push(this.pad(report.itemDescription, 55));                 // Description

        // JEWELRY/MATERIAL SPEC BLOCK
        parts.push(typeMetal);                                             // Type+Metal (2)
        parts.push(this.formatNumber(report.itemKarat, 6, 2));            // Karat
        parts.push(this.formatNumber(report.itemWeight, 6, 2));           // Weight
        parts.push(this.pad((report.itemSize || 'N').toUpperCase(), 2));  // Size/link type
        parts.push(this.pad(report.itemSize || '', 6));                   // Size length
        parts.push(this.formatInteger(report.itemQuantity, 2));           // Quantity
        parts.push(this.pad(report.stoneShape || '', 1));                 // Shape
        parts.push(this.formatNumber(0, 6, 2));                           // Placeholder
        parts.push(this.formatNumber(0, 6, 2));                           // Placeholder
        parts.push(this.pad(report.stoneColor || '', 1));                 // Color
        parts.push(this.formatInteger(0, 2));                             // Placeholder
        parts.push(this.formatNumber(0, 6, 2));                           // Placeholder
        parts.push(this.formatNumber(0, 6, 2));                           // Placeholder

        // AMOUNT
        parts.push(this.formatNumber(report.itemAmount, 10, 2));          // Amount

        // TRAILING REFERENCE BLOCK
        parts.push(this.pad('', 27));                                      // Spacer
        parts.push(this.pad(report.controlNumber, 6));                    // Control # repeat
        parts.push(this.pad(report.username || '', 3));                   // Clerk initials
        parts.push(this.pad('', 2));                                       // Spacer
        parts.push(this.pad(report.controlNumber, 6));                    // Control # repeat
        parts.push(this.pad('', 13));                                      // Spacer
        parts.push(this.pad(report.customerAddress, 27));                 // Address repeat
        parts.push(this.pad(report.customerCity, 20));                    // City repeat
        parts.push(custStateZip);                                          // State+Zip repeat
        parts.push(this.pad('', 2));                                       // Spacer
        parts.push(this.pad('1', 1));                                      // Item sequence
        parts.push(this.pad(report.itemType, 14));                        // Item type repeat
        parts.push(this.pad(report.itemBrand, 20));                       // Brand repeat
        parts.push(this.pad('', 51));                                      // Spacer/notes
        parts.push((report.recordType || 'J').toString().slice(0, 1).toUpperCase()); // Record type

        return parts.join('');
    }

    private pad(value: string | number | null | undefined, length: number, align: 'left' | 'right' = 'left'): string {
        const raw = (value ?? '').toString();
        const str = raw.slice(0, length);
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

    private formatSexRace(sex: string | null | undefined, race: string | null | undefined): string {
        const s = (sex || '').toUpperCase().slice(0, 1);
        const r = (race || '').toUpperCase().slice(0, 1);
        return `${s}${r}`.padEnd(2, ' ');
    }

    private formatHeight(value: string | null | undefined): string {
        if (!value) return ''.padEnd(6, ' ');
        const clean = value.replace(/[^0-9'".]/g, '');
        return clean.slice(0, 6).padEnd(6, ' ');
    }

    private formatInteger(value: number | string | null | undefined, width: number): string {
        if (value === null || value === undefined || value === '') return ''.padStart(width, ' ');
        const num = typeof value === 'string' ? parseInt(value, 10) : Math.trunc(value);
        return isNaN(num) ? ''.padStart(width, ' ') : num.toString().padStart(width, ' ');
    }

    private formatNumber(value: number | string | null | undefined, width: number, decimals: number): string {
        if (value === null || value === undefined || value === '') return ''.padStart(width, ' ');
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return ''.padStart(width, ' ');
        return num.toFixed(decimals).padStart(width, ' ');
    }

    private formatZip(zip: string | null | undefined): string {
        const raw = (zip || '').toString().replace(/[^0-9]/g, '');
        if (raw.length >= 5) {
            const base = raw.slice(0, 5);
            const ext = raw.length > 5 ? raw.slice(5) : '';
            return base + '-' + ext.padEnd(4, ' ');
        }
        return (raw + '     ').slice(0, 5) + '-    ';
    }

    private altPhonePlaceholder(): string {
        return '(   )';
    }

    private initial(text: string | null | undefined): string {
        return ((text || '').toUpperCase().trim().slice(0, 1)) || '';
    }
}
