import { formatDate, formatCurrency } from '@/lib/utils';
import { Customer } from '@/app/feature/_shared/customer';
import JsBarcode from 'jsbarcode';

export interface ReceiptPrintData {
  type: 'SALE' | 'REDEMPTION';
  ticketNumber: string; // or Sale ID
  amount: number;
  subtotal?: number;
  tax?: number;
  employee: string;
  date: string;
  time?: string;
  customer: {
    firstName: string;
    middleName?: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    dob: string;
    idType: string;
    idNumber: string;
  };
  items: any[];
  amountPaid: number;
  tenders?: { type: string; amount: number }[];
  change?: number;
  totalTendered?: number;
  dateRedeemed?: string;
  nextDueDate?: string;
  nextPayment?: number;
}

const STORE = {
  name: "LARRY'S ESTATE JEWELRY & PAWN",
  address1: "3316 CLEVELAND AVE",
  address2: "FORT MYERS, FL 33901",
  phone: "(239) 939-3633"
};

export class ReceiptPrinter {

  async print(data: ReceiptPrintData): Promise<{ success: boolean; error?: string }> {
    try {
      const html = this.generateHTML(data);

      if ((window as any).electronAPI?.printDocument) {
        const result = await (window as any).electronAPI.printDocument(html);
        return result.success ? { success: true } : { success: false, error: result.error || 'Print failed' };
      }

      const w = window.open('', '_blank');
      if (!w) throw new Error('Failed to open print window');
      w.document.write(html);
      w.document.close();
      w.focus();
      // setTimeout to allow rendering before print in some browsers
      setTimeout(() => {
        w.print();
        w.close();
      }, 250);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Print failed' };
    }
  }

  private generateHTML(data: ReceiptPrintData): string {
    const isSale = data.type === 'SALE';
    const customerName = [data.customer.firstName, data.customer.middleName, data.customer.lastName].filter(Boolean).join(' ');
    const barcodeDataUrl = this.generateBarcodeBase64(data.ticketNumber);

    // Legal text
    const legalText = isSale
      ? `PAID IN FULL\nALL SALES FINAL`
      : `Pawner hereby certifies that he or she is legally empowered to sell or dispose of the above property and that said property is free and clear of all liens and encumbrances. Pawner will be responsible for any legal fees incurred by purchaser resulting from this transaction.`;

    // Only render detailed items for SALE, or if needed. 
    // sales.md shows specific item format: [Inv#] [Qty] @ [Price] \n [Desc]
    const renderItems = () => {
      if (isSale) {
        return data.items.map(item => `
                <div class="item-row">
                    <div class="row">
                        <span>${item.inventoryNumber || item.controlNumber || ''}</span>
                        <span>${item.quantity || 1} @ ${formatCurrency(item.price || item.amount || item.lineAmount || 0)}</span>
                    </div>
                    <div class="item-desc">${item.description || item.itemDescription}</div>
                </div>
            `).join('');
      }
      return data.items.map(item => `<div class="item">${item.description || item.itemDescription || item}</div>`).join('');
    };

    const renderTotals = () => {
      if (isSale) {
        return `
                <div class="totals-section">
                    <div class="row"><span>SUB TOTAL:</span> <span>${formatCurrency(data.subtotal || 0)}</span></div>
                    <div class="row"><span>SALES TAX:</span> <span>${formatCurrency(data.tax || 0)}</span></div>
                    <div class="row bold"><span>SALES TOTAL:</span> <span>${formatCurrency(data.amount)}</span></div>
                    ${data.tenders?.map(t => `<div class="row"><span>${t.type.toUpperCase()}:</span> <span>${formatCurrency(t.amount)}</span></div>`).join('') || ''}
                    <div class="row"><span>TOTAL TENDERED:</span> <span>${formatCurrency(data.totalTendered || 0)}</span></div>
                    <div class="row"><span>CHANGE:</span> <span>${formatCurrency(data.change || 0)}</span></div>
                </div>
            `;
      }
      return `
            <div class="text-center">
                <div>Amount paid:    ${formatCurrency(data.amountPaid)}</div>
                ${!isSale ? `<div>Items redeemed on: ${data.dateRedeemed || data.date}</div>` : ''}
                ${data.nextDueDate ? `<br><div>Next Due Date: ${data.nextDueDate}</div>` : ''}
                ${data.nextPayment ? `<div>Next Payment: ${formatCurrency(data.nextPayment)}</div>` : ''}
            </div>
        `;
    };

    // Signature line only for non-sale? sales.md doesn't show signature line, but shows "PAID IN FULL"
    const renderFooter = () => {
      if (isSale) {
        return `
                <div class="legal text-center bold" style="margin-top: 20px;">${legalText}</div>
            `;
      }
      return `
            ${legalText ? `<div class="legal text-center">${legalText}</div>` : ''}
            <br><br>
            <div class="signature-line"></div>
            <div class="text-center">Pawner's Signature</div>
        `;
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 80mm; /* Thermal paper width commonly 80mm */
      margin: 0 auto;
      padding: 10px;
      color: black;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed black; margin: 10px 0; }
    .section { margin-bottom: 15px; }
    .row { display: flex; justify-content: space-between; }
    .items-list { margin: 10px 0; }
    .item { margin-bottom: 5px; }
    .item-row { margin-bottom: 10px; }
    .item-desc { padding-left: 0; } /* Adjusted based on sales.md which doesn't seem to indent desc much */
    .legal { font-size: 12px; margin: 15px 0; white-space: pre-wrap; width: 100%; }
    .signature-line { border-top: 1px solid black; width: 80%; margin: 30px auto 5px auto; }
    .totals-section { margin-top: 10px; display: flex; flex-direction: column; align-items: flex-end; }
    .totals-section .row { width: 100%; justify-content: flex-end; gap: 20px; }
    
    @media print {
      body { width: 100%; margin: 0; padding: 0; }
    }
    .barcode-container {
      display: flex;
      justify-content: center;
      margin-bottom: 5px;
    }
    .barcode {
      height: 40px;
      width: auto;
    }
  </style>
</head>
<body>
  <div class="text-center bold">
    ${STORE.name}<br>
    ${STORE.address1}<br>
    ${STORE.address2}<br>
    ${STORE.phone}
  </div>

  <div class="text-center" style="margin: 10px 0;">
    ${isSale ? `<div class="barcode-container"><img src="${barcodeDataUrl}" class="barcode" /></div>` : ''}
    <div class="bold">${isSale ? 'SALES RECEIPT #' : 'TICKET #'} ${data.ticketNumber}</div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div>Emp: ${data.employee}</div>
    <div>Date: ${data.date}</div>
    ${data.time ? `<div>Time: ${data.time}</div>` : ''}
    <div>Name: ${customerName}</div>
  </div>

  <div class="divider"></div>

  <div class="items-list">
    ${renderItems()}
  </div>

  <div class="divider"></div>

  ${renderTotals()}

  ${renderFooter()}
  
</body>
</html>
    `;
  }

  private generateBarcodeBase64(value: string): string {
    if (!value) return '';
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, value, {
        format: 'CODE39',
        displayValue: false,
        height: 40,
        margin: 0,
        width: 1,
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Barcode generation failed:', e);
      return '';
    }
  }
}
