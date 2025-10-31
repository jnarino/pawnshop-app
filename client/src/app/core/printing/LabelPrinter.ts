import type { TransactionPrintData, PrintResult } from './types';

export class LabelPrinter {
  /**
   * Print item labels to GoDEX thermal printer (1.51" x 1.30")
   */
  async print(data: TransactionPrintData): Promise<PrintResult> {
    try {
      if (!data || !data.items || data.items.length === 0) {
        throw new Error('No items to print');
      }

      // Electron: Send to GoDEX printer via IPC
      if (window.electronAPI?.printLabels) {
        return await window.electronAPI.printLabels(data.items);
      }
      
      // Browser: Generate HTML for testing
      const html = this.generateHTML(data);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      
      return { success: true, count: data.items.length };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Label print failed'
      };
    }
  }

  private generateHTML(data: TransactionPrintData): string {
    const typeCode = data.ticketType === 'PAWN' ? 'P' : 'B';
    const dateStr = new Date(data.transactionDate).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
    const customerNameShort = `${data.customerLastName}, ${data.customerFirstInitial}`.toUpperCase();

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Item Labels - ${data.controlNumber}</title>
  <style>
    @page { size: 1.51in 1.30in; margin: 0; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    
    .label { 
      width: 1.51in; height: 1.30in; padding: 0.05in;
      page-break-after: always; display: flex; flex-direction: column;
      box-sizing: border-box; font-size: 7pt; line-height: 1.1;
    }
    
    .row1 { display: flex; justify-content: space-between; font-weight: bold; font-size: 8pt; margin-bottom: 1px; }
    .row2, .row3 { display: flex; justify-content: space-between; font-size: 7pt; margin-bottom: 1px; }
    .row3 { font-size: 6pt; }
    .row4 { font-size: 6pt; margin-bottom: 2px; color: #666; }
    .row5 { margin-top: auto; text-align: center; }
    .control-number { font-family: monospace; font-size: 11pt; font-weight: bold; letter-spacing: 1px; }
    .barcode { font-family: monospace; font-size: 16pt; }
    .row6 { text-align: center; font-size: 6pt; font-weight: bold; margin-top: 1px; }
  </style>
</head>
<body>
  ${data.items.map((item, idx) => {
    const brand = item.brand || '';
    const category = item.category || '';
    const karatInfo = item.karat || item.metal || '';
    const weightInfo = item.weight && item.weightUnit ? `${item.weight}${item.weightUnit}` : '';
    const lengthInfo = item.length ? `${item.length}"` : '';
    const specs = [karatInfo, lengthInfo].filter(Boolean).join(' ');
    
    return `
    <div class="label">
      <div class="row1">
        <div>${customerNameShort}</div>
        <div>${typeCode} ${dateStr}</div>
      </div>
      <div class="row2">
        <div>${brand} ${category}</div>
        <div>${specs}</div>
      </div>
      <div class="row3">
        <div>${item.description}</div>
        <div>${weightInfo}</div>
      </div>
      <div class="row4">CODE: ___</div>
      <div class="row5">
        <div class="control-number">${item.inventoryNumber}</div>
        <div class="barcode">*${item.inventoryNumber}*</div>
      </div>
      <div class="row6">${idx + 1} of ${data.items.length}</div>
    </div>
    `;
  }).join('')}
  <script>window.print();</script>
</body>
</html>
    `;
  }
}
