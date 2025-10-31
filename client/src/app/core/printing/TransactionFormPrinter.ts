import type { TransactionPrintData, PrintResult } from './types';

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
  <!-- Transaction Date (top right, adjust coordinates to match your form) -->
  <div class="field" style="top: 1.2in; left: 6.5in;">
    ${new Date(data.transactionDate).toLocaleDateString('en-US')}
  </div>
  
  <!-- Control Number (adjust position to match form) -->
  <div class="field bold" style="top: 1.5in; left: 2in;">
    ${data.controlNumber}
  </div>
  
  <!-- Customer Name -->
  <div class="field" style="top: 2in; left: 1.5in;">
    ${data.customerName}
  </div>
  
  <!-- Customer Address (if available) -->
  ${data.customerAddress ? `
  <div class="field" style="top: 2.3in; left: 1.5in;">
    ${data.customerAddress}
  </div>
  ` : ''}
  
  <!-- Customer ID -->
  ${data.customerId ? `
  <div class="field" style="top: 2.6in; left: 5.5in;">
    ${data.customerId}
  </div>
  ` : ''}
  
  <!-- Items Table (adjust top position to match form's item section) -->
  ${data.items.map((item, idx) => {
    const rowTop = 4.0 + (idx * 0.3); // 0.3in spacing between rows
    return `
    <div class="item-row" style="top: ${rowTop}in;">
      <span class="item-no">${idx + 1}</span>
      <span class="item-inv">${item.inventoryNumber}</span>
      <span class="item-desc">${item.description.substring(0, 50)}</span>
      <span class="item-amt">$${item.amount}</span>
    </div>
    `;
  }).join('')}
  
  <!-- Financial Summary (adjust positions to match form fields) -->
  <div class="field bold" style="top: 8in; left: 6in;">
    $${itemsTotal.toFixed(2)}
  </div>
  
  ${data.ticketType === 'PAWN' ? `
  <div class="field bold" style="top: 8.3in; left: 6in;">
    $${financeCharge.toFixed(2)}
  </div>
  
  <div class="field bold" style="top: 8.6in; left: 6in;">
    $${totalRedemption.toFixed(2)}
  </div>
  ` : ''}
  
  <script>
    // Auto-print when loaded
    window.onload = () => {
      window.print();
    };
  </script>
</body>
</html>
    `;
  }
}
