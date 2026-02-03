
import { formatDate, formatCurrency } from '@/lib/utils';
import { Customer } from '@/app/feature/_shared/customer';

export interface ReceiptPrintData {
  type: 'SALE' | 'REDEMPTION';
  ticketNumber: string; // or Sale ID
  amount: number;
  employee: string;
  date: string;
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

    // Legal text
    const legalText = isSale
      ? `Pawner hereby certifies that he or she is legally empowered to sell or dispose of the above property and that said property is free and clear of all liens and encumbrances. Pawner will be responsible for any legal fees incurred by purchaser resulting from this transaction.`
      : '';

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
    .divider { border-top: 1px solid black; margin: 10px 0; }
    .section { margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; }
    .items-list { margin: 10px 0; }
    .item { margin-bottom: 5px; }
    .legal { font-size: 10px; margin: 15px 0; white-space: pre-wrap; width: 90%; }
    .signature-line { border-top: 1px solid black; width: 80%; margin: 30px auto 5px auto; }
    
    @media print {
      body { width: 100%; margin: 0; padding: 0; }
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

  <div class="divider"></div>

  <div class="row">
    <span>Ticket #: ${data.ticketNumber}</span>
    <span>Amt: ${formatCurrency(data.amount)}</span>
  </div>
  <div>Emp: ${data.employee}</div>
  <div>Date: ${data.date}</div>

  <div class="divider"></div>

  <div class="section">
    <div>Name: ${customerName}</div>
    <div style="padding-left: 45px;">
      ${data.customer.address}<br>
      ${data.customer.city}, ${data.customer.state} ${data.customer.zip}
    </div>
    <div>Phone: ${data.customer.phone}</div>
    <div>DOB:   ${data.customer.dob}</div>
    <div>ID:    ${data.customer.idType}</div>
    <div style="padding-left: 45px;">${data.customer.idNumber}</div>
  </div>

  <div class="items-list">
    ${data.items.map(item => `<div class="item">${item.description}</div>`).join('')}
  </div>

  <div class="divider"></div>

  ${legalText ? `<div class="legal text-center">${legalText}</div>` : ''}

  <div class="text-center">
    <div>Amount paid:    ${formatCurrency(data.amountPaid)}</div>
    ${!isSale ? `<div>Items redeemed on: ${data.dateRedeemed || data.date}</div>` : ''}
    ${data.nextDueDate ? `<br><div>Next Due Date: ${data.nextDueDate}</div>` : ''}
    ${data.nextPayment ? `<div>Next Payment: ${formatCurrency(data.nextPayment)}</div>` : ''}
  </div>

  <br><br>

  <div class="signature-line"></div>
  <div class="text-center">Pawner's Signature</div>
  
</body>
</html>
    `;
  }
}
