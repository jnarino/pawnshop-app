// TransactionFormPrinter.ts
// Florida Pawnbroker Transaction Form (layout per user's spec)
// Print settings: Letter 8.5"x11", Scale 100%, Margins None/0, no "Fit to page".

import templateDef from './templates/floridapawn.template.json';
import JsBarcode from 'jsbarcode';

/** ===== Types (self-contained) ===== */
export type PrintResult = { success: true } | { success: false; error: string };
export type TicketType = 'PURCHASE' | 'PAWN' | 'CONSIGNMENT';

export type PrintAdjust = {
    offxIn?: number;         // global X nudge in inches (+ right)
    offyIn?: number;         // global Y nudge in inches (+ down)
    scaleX?: number;         // 0.997–1.003 typical
    scaleY?: number;
    debug?: boolean;         // overlay grid + optional background image
    debugBackgroundUrl?: string; // e.g. '/assets/pawnTicket.png'
};

export type TransactionItemPrint = {
    // line 1
    serialNumber?: string;
    ownerAppliedNumber?: string;  // "owner mark"
    itemType?: string;            // general type (ring, TV, firearm, etc.)
    brand?: string;
    modelNumber?: string;

    // line 2
    description: string;          // long free text
    type?: string;                // sub-type if any (stone type, etc.)
    action?: string;              // firearm action if any
    gaugeCaliber?: string;        // gauge/caliber
    finish?: string;              // finish
    barrel?: string;              // barrel length
    amount?: number | string;     // $ per item
    categoryLabel?: string;
};

export type TransactionPrintData = {
    // basics
    transactionDate: string | number | Date;
    maturityDate?: string | number | Date;
    defaultDate?: string | number | Date;
    controlNumber?: string;
    ticketType: TicketType;

    // seller/pedgor block (exact order per spec)
    customerLastName?: string;
    customerFirst?: string;
    customerMiddle?: string;
    customerBirthdate?: string; // mm/dd/yyyy
    customerSex?: string;       // M/F
    customerRace?: string;      // code (W, B, A, AS, H)

    customerAddress?: string;
    customerCity?: string;
    customerState?: string;
    customerZip?: string;
    customerPhone?: string;

    customerEmployer?: string;

    customerIdNumber?: string;   // DL number
    customerIdType?: string;     // "DRIVER LICENSE" recommended
    customerIdState?: string;    // issuing state

    customerHeight?: string;
    customerWeight?: string;
    customerEyes?: string;
    customerHair?: string;

    // items (up to 6)
    items: TransactionItemPrint[];

    // totals (bottom-left table)
    amountFinanced?: number | string;
    financeCharge?: number | string;
    totalOfPayments?: number | string;
    annualRate?: number | string;

    // misc
    employeeInitials?: string;

    // calibration
    printAdjust?: PrintAdjust;
};

type TemplateField = {
    id: string;
    x: number;
    y: number;
    w?: number;
    h?: number;     // height in mm (optional)
    size: number;
    uppercase?: boolean;
};

type TemplateRepeaterField = TemplateField & { wrap?: boolean };

type TemplateRepeater = {
    id: string;
    at: { x: number; y: number };
    row: { dy: number };
    limit?: number;
    fields: TemplateRepeaterField[];
};

type TemplateDefinition = {
    fields: TemplateField[];
    repeaters?: TemplateRepeater[];
    page?: { background?: string };
};

const STORE = {
    name: import.meta?.env?.VITE_STORE_NAME ?? "LARRY'S ESTATE JEWELRY & PAWN",
    address1: import.meta?.env?.VITE_STORE_ADDRESS1 ?? '1726 CAPE CORAL PKWY',
    address2: import.meta?.env?.VITE_STORE_ADDRESS2 ?? 'CAPE CORAL, FL 33904',
    phone: import.meta?.env?.VITE_STORE_PHONE ?? '(239) 594-8881',
};

const LS_KEY = 'fl_pawn_form_adjust_v2';

/** ===== Helpers ===== */
const CITY_STATE_ZIP = /^(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/;

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]!));

const fmtMoney = (v?: string | number) => {
    if (v === undefined || v === null || v === '') return '';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : '';
};

const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
};

// ... inside generateFillInHTML ...

const parseMoney = (value?: string | number) => {
    if (value === undefined || value === null || value === '') return 0;
    const raw = typeof value === 'number' ? value.toString() : value;
    const cleaned = raw.replace(/[^0-9.-]/g, '');
    return cleaned ? Number(cleaned) : 0;
};

const renderField = (field: TemplateField, value: string) => {
    // If value contains HTML tags (like <img>), render as-is without escaping
    const content = value.trim().startsWith('<') ? value : escapeHtml(field.uppercase ? value.toUpperCase() : value);
    const width = field.w ? `width:${field.w}mm;` : '';
    // ensure height is set for barcodes
    const height = field.h ? `height:${field.h}mm;` : '';
    return `<div class="tpl-field" style="left:${field.x}mm;top:${field.y}mm;${width}${height}font-size:${field.size}pt;">${content}</div>`;
};

const renderRepeater = (tpl: TemplateRepeater | undefined, rows: Record<string, string>[]) => {
    if (!tpl) return '';
    const limit = tpl.limit ?? rows.length;
    let html = '';
    for (let index = 0; index < limit; index++) {
        const row = rows[index] ?? {};
        const baseY = tpl.at.y + index * tpl.row.dy;
        html += tpl.fields
            .map(field => {
                const value = row[field.id] ?? '';
                const text = field.uppercase ? value.toUpperCase() : value;
                const width = field.w ? `width:${field.w}mm;` : '';
                return `<div class="tpl-field" style="left:${tpl.at.x + field.x}mm;top:${baseY + field.y}mm;${width}font-size:${field.size}pt;">${escapeHtml(
                    text
                )}</div>`;
            })
            .join('');
    }
    return html;
};

const TEMPLATE = templateDef as TemplateDefinition;

const templateBackground = (() => {
    const raw = TEMPLATE.page?.background || '';
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) return raw;
    // assume template assets live in /templates within public; strip leading './'
    return `/templates/${raw.replace(/^\.?\//, '')}`;
})();

/** ===== Main Printer ===== */

export class TransactionFormPrinter {
    private generateBarcodeBase64(value: string): string {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, value, {
            format: 'CODE128',
            displayValue: false,
            height: 40,
            margin: 0,
        });
        return canvas.toDataURL('image/png');
    }

    async print(data: TransactionPrintData): Promise<PrintResult> {
        try {
            const barcodeDataUrl = data.controlNumber ? this.generateBarcodeBase64(data.controlNumber) : '';
            const html = this.generateFillInHTML(data, barcodeDataUrl);
            if (window.electronAPI?.printDocument) {
                const raw = await window.electronAPI.printDocument(html);
                return raw.success
                    ? { success: true }
                    : { success: false, error: raw.error ?? 'Print failed' };
            }
            const w = window.open('', '_blank');
            if (!w) throw new Error('Failed to open print window');
            w.document.write(html);
            w.document.close();
            w.focus();
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Print failed' };
        }
    }

    private resolveAdjust(raw?: PrintAdjust) {
        let saved: PrintAdjust | null = null;
        try {
            const stored = localStorage.getItem(LS_KEY);
            if (stored) saved = JSON.parse(stored);
        } catch {
            saved = null;
        }
        return {
            offxIn: saved?.offxIn ?? raw?.offxIn ?? 0,
            offyIn: saved?.offyIn ?? raw?.offyIn ?? 0,
            scaleX: saved?.scaleX ?? raw?.scaleX ?? 1,
            scaleY: saved?.scaleY ?? raw?.scaleY ?? 1,
            debug: raw?.debug ?? saved?.debug ?? false,
            debugBackgroundUrl: raw?.debugBackgroundUrl ?? saved?.debugBackgroundUrl ?? undefined,
        };
    }

    private generateFillInHTML(data: TransactionPrintData, barcodeDataUrl?: string): string {
        if (!data || !Array.isArray(data.items)) {
            throw new Error('Invalid print data: items array required');
        }

        const txnDate = new Date(data.transactionDate);
        const maturityDate = data.maturityDate ? new Date(data.maturityDate) : undefined;
        const defaultDate = data.defaultDate ? new Date(data.defaultDate) : undefined;
        const timeStr = txnDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const businessMatch = STORE.address2?.match(CITY_STATE_ZIP);
        const businessCity = businessMatch?.[1] ?? STORE.address2 ?? '';
        const businessState = businessMatch?.[2] ?? '';
        const businessZip = businessMatch?.[3] ?? '';

        const amountFinancedNum = parseMoney(data.amountFinanced);
        const financeChargeNum = parseMoney(data.financeCharge);
        const twoMonthAmount =
            amountFinancedNum && financeChargeNum ? fmtMoney(amountFinancedNum + financeChargeNum * 2) : '';

        const fieldValues: Record<string, string> = {
            businessName: STORE.name,
            businessAddress: STORE.address1 ?? '',
            businessCity,
            businessState,
            businessZip,
            businessPhone: STORE.phone ?? '',
            transactionDate: txnDate.toLocaleDateString(),
            transactionTime: timeStr,
            controlNumber: '', // User requested barcode only, no number
            controlNumberBarcode: barcodeDataUrl ? `<img src="${barcodeDataUrl}" style="height: 100%; max-width: 100%;" />` : '',
            buyCheckbox: data.ticketType === 'PURCHASE' ? 'X' : '',
            pawnCheckbox: data.ticketType === 'PAWN' ? 'X' : '',
            lastName: data.customerLastName ?? '',
            firstName: data.customerFirst ?? '',
            middleName: data.customerMiddle ?? '',
            dob: data.customerBirthdate ?? '',
            sex: data.customerSex ?? '',
            raceCode: (() => {
                const race = (data.customerRace ?? '').toUpperCase();
                // "W for white B for black I for American Indian A for Asian and H for hispanic"
                if (race.includes('WHITE')) return 'W';
                if (race.includes('BLACK')) return 'B';
                if (race.includes('INDIAN') || race.includes('NATIVE')) return 'I';
                if (race.includes('ASIAN')) return 'A';
                if (race.includes('HISPANIC') || race.includes('LATINO')) return 'H';
                return race.charAt(0); // Fallback to first letter
            })(),
            addressLine: [data.customerAddress, data.customerCity, data.customerState, data.customerZip].filter(Boolean).join(', '),
            phone: data.customerPhone ?? '',
            employer: data.customerEmployer ?? '',
            licenseNumber: data.customerIdNumber ?? '',
            licenseType: data.customerIdType ?? '',
            licenseState: data.customerIdState ?? '',
            height: data.customerHeight ?? '',
            weight: data.customerWeight ?? '',
            eyeColor: data.customerEyes ?? '',
            hairColor: data.customerHair ?? '',
            amountFinanced: fmtMoney(data.amountFinanced),
            financeCharge: fmtMoney(data.financeCharge),
            redeemPrice: fmtMoney(data.totalOfPayments),
            annualPercentageRate: typeof data.annualRate === 'number' ? data.annualRate.toFixed(2) : (data.annualRate?.toString() ?? ''),
            maturityDate: maturityDate ? maturityDate.toLocaleDateString() : '',
            pawnDefaultDate: defaultDate ? defaultDate.toLocaleDateString() : '',
            amountWith2MonthsInterest: twoMonthAmount,
        };

        const fieldHtml = TEMPLATE.fields.map(field => renderField(field, fieldValues[field.id] ?? '')).join('');

        // Prepare item chunks
        const itemRepeater = TEMPLATE.repeaters?.find(r => r.id === 'items');
        const limit = itemRepeater?.limit ?? 6;
        const allItems = data.items.map(item => ({
            serial: item.serialNumber ?? item.ownerAppliedNumber ?? '',
            type: item.categoryLabel ?? item.itemType ?? '',
            brand: item.brand ?? '',
            modelNumber: item.modelNumber ?? '',
            description: item.description ?? '',
            amount: fmtMoney(item.amount),
        }));

        const chunks: Record<string, string>[][] = [];
        if (allItems.length === 0) {
            chunks.push([]);
        } else {
            for (let i = 0; i < allItems.length; i += limit) {
                chunks.push(allItems.slice(i, i + limit));
            }
        }

        const pagesHtml = chunks.map((chunk, pageIndex) => {
            const repeaterHtml = renderRepeater(itemRepeater, chunk);
            return `
             <div class="page">
               <div class="tpl-layer">
                 ${fieldHtml}
                 ${repeaterHtml}
               </div>
             </div>
             `;
        }).join('');

        const adjust = this.resolveAdjust(data.printAdjust);
        const transform = `translate(${adjust.offxIn ?? 0}in, ${adjust.offyIn ?? 0}in) scale(${adjust.scaleX ?? 1}, ${adjust.scaleY ?? 1})`;
        // const debugBg = adjust.debug ? adjust.debugBackgroundUrl ?? templateBackground : templateBackground;

        return `
<!DOCTYPE html>
<html>
<head>
  <title>Pawn Transaction - ${escapeHtml(data.controlNumber ?? '')}</title>
  <style>
    @page { size: 8.5in 11in; margin: 0; }
    body {
      margin: 0;
      padding: 0;
      background: #f0f0f0;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
    }
    .page {
      position: relative;
      width: 8.5in;
      height: 11in;
      background: white;
      overflow: hidden;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .tpl-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 210mm;
      height: 297mm;
      transform-origin: top left;
      transform: ${transform};
    }
    .tpl-field {
      position: absolute;
      line-height: 1.1;
      white-space: nowrap;
      color: #000000;
      font-weight: 700;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
       body { background: none; }
       .page { page-break-after: always; } 
    }
  </style>
</head>
<body>
  ${pagesHtml}
  <script>window.print();</script>
</body>
</html>`;
    }
}
