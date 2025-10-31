import type { TransactionPrintData, PrintResult } from './types';

const STORE = {
  name: import.meta.env.VITE_STORE_NAME ?? 'LARRY\'S ESTATE JEWELRY & PAWN',
  address1: import.meta.env.VITE_STORE_ADDRESS1 ?? '3316 CLEVELAND AVE.',
  address2: import.meta.env.VITE_STORE_ADDRESS2 ?? 'FORT MYERS, FL 33901',
  phone: import.meta.env.VITE_STORE_PHONE ?? '(239) 399-3633'
};

export class TransactionFormPrinter {
  /**
   * Print data to fill in pre-printed Florida Pawnbroker Transaction Form
   * This assumes the form is already loaded in the printer
   */
  async print(data: TransactionPrintData): Promise<PrintResult> {
    try {
      const html = this.generateFillInHTML(data);
      
      // Electron: Use system printer
      if (window.electronAPI?.printDocument) {
        return await window.electronAPI.printDocument(html);
      }
      
      // Browser: Open print dialog
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Print failed'
      };
    }
  }

  /**
   * Generate HTML that positions text to fill in pre-printed form fields
   * Uses absolute positioning to match the form layout
   */
  private generateFillInHTML(data: TransactionPrintData): string {
    if (!data || !data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid print data: items array required');
    }

    // Calculate totals for pawn transactions
    const itemsTotal = data.items.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
    const financeCharge = data.financials?.financeCharge || 0;
    const totalRedemption = data.financials?.totalOfPayments || itemsTotal + financeCharge;
    const txnDate = new Date(data.transactionDate);
    const maturityDate = data.maturityDate ? new Date(data.maturityDate) : undefined;
    const timeStr = txnDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatPhone = (value?: string) => value ? value.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : '';
    const customerName = `${data.customerLastName?.toUpperCase() ?? ''}, ${data.customerFirst?.toUpperCase() ?? ''} ${data.customerMiddle?.toUpperCase() ?? ''}`.trim();
    const primaryItem = data.items[0];
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Pawn Transaction - ${data.controlNumber}</title>
  <style>
    @page { 
      size: 8.5in 11in; 
      margin: 0; 
    }
    body { 
      margin: 0; 
      padding: 0;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      position: relative;
      width: 8.5in;
      height: 11in;
    }
    
    /* Absolute positioning to fill in form fields */
    .field {
      position: absolute;
      white-space: nowrap;
    }
    
    /* Bold for important fields */
    .bold { font-weight: bold; font-size: 11pt; }
    
    /* Table rows for items */
    .item-row {
      position: absolute;
      width: 7.5in;
      left: 0.5in;
      display: flex;
      justify-content: space-between;
    }
    .item-no { width: 0.5in; }
    .item-inv { width: 1.5in; }
    .item-desc { width: 4in; }
    .item-amt { width: 1in; text-align: right; }
  </style>
</head>
<body>
  <div class="field" style="top:0.45in;left:0.55in;font-weight:bold;font-size:12pt;">${STORE.name}</div>
  <div class="field" style="top:0.65in;left:0.55in;">${STORE.address1}</div>
  <div class="field" style="top:0.82in;left:0.55in;">${STORE.address2}</div>
  <div class="field" style="top:0.99in;left:0.55in;">${STORE.phone}</div>

  <div class="field bold" style="top:0.45in;left:5.65in;">${txnDate.toLocaleDateString()}</div>
  <div class="field bold" style="top:0.70in;left:5.65in;">${data.controlNumber}</div>
  <div class="field bold" style="top:0.95in;left:5.65in;">${timeStr}</div>
  <div class="field bold" style="top:1.20in;left:5.65in;">${maturityDate ? maturityDate.toLocaleDateString() : ''}</div>
  <div class="field bold" style="top:1.45in;left:5.65in;">${data.ticketType === 'PAWN' ? 'PAWN' : 'PURCHASE'}</div>

  <div class="field" style="top:1.40in;left:0.55in;">${customerName}</div>
  <div class="field" style="top:1.65in;left:0.55in;">${data.customerAddress?.toUpperCase() ?? ''}</div>
  <div class="field" style="top:1.90in;left:0.55in;">${`${data.customerCity ?? ''}, ${data.customerState ?? ''} ${data.customerZip ?? ''}`.toUpperCase()}</div>
  <div class="field" style="top:2.15in;left:0.55in;">${formatPhone(data.customerPhone)}</div>
  <div class="field" style="top:2.40in;left:0.55in;">${data.customerEmployer ?? ''}</div>

  <div class="field" style="top:1.40in;left:3.45in;">${data.customerIdNumber ?? ''}</div>
  <div class="field" style="top:1.65in;left:3.45in;">${data.customerIdType ?? ''}</div>
  <div class="field" style="top:1.90in;left:3.45in;">${data.customerIdState ?? ''}</div>
  <div class="field" style="top:2.15in;left:3.45in;">${data.customerBirthdate ?? ''}</div>
  <div class="field" style="top:2.40in;left:3.45in;">${data.customerSex ?? ''}</div>
  <div class="field" style="top:2.65in;left:3.45in;">${data.customerHeight ?? ''}</div>
  <div class="field" style="top:2.90in;left:3.45in;">${data.customerWeight ?? ''}</div>
  <div class="field" style="top:3.15in;left:3.45in;">${data.customerEyes ?? ''}</div>
  <div class="field" style="top:3.40in;left:3.45in;">${data.customerHair ?? ''}</div>
  <div class="field" style="top:3.65in;left:3.45in;">${data.customerRace ?? ''}</div>

  ${data.items.map((item, idx) => {
    const top = 4.10 + idx * 0.35;
    const amount = item.amount ? `$${parseFloat(item.amount).toFixed(2)}` : '';
    return `
    <div class="item-row" style="top:${top}in;">
      <span class="item-no">${idx + 1}</span>
      <span class="item-inv">${item.inventoryNumber}</span>
      <span class="item-desc">${item.description.toUpperCase()}</span>
      <span class="item-amt">${amount}</span>
    </div>`;
  }).join('')}

  <div class="field bold" style="top:8.40in;left:5.90in;">${data.amountFinanced ?? ''}</div>
  <div class="field bold" style="top:8.65in;left:5.90in;">${data.financeCharge ?? ''}</div>
  <div class="field bold" style="top:8.90in;left:5.90in;">${data.totalOfPayments ?? ''}</div>
  <div class="field bold" style="top:9.15in;left:5.90in;">${data.annualRate ?? ''}</div>
  <div class="field bold" style="top:9.40in;left:5.90in;">${maturityDate ? maturityDate.toLocaleDateString() : ''}</div>

  <div class="field" style="top:10.15in;left:1.90in;">${data.employeeInitials ?? ''}</div>

  <script>window.print();</script>
</body>
</html>
    `;
  }
}
