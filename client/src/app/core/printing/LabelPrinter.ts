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
    const txnDate = new Date(data.transactionDate).toLocaleDateString();
    const customerLine = `${(data.customerLastName ?? '').toUpperCase()}, ${(data.customerFirst ?? '').toUpperCase()}${data.customerMiddleInitial ? ' ' + data.customerMiddleInitial.toUpperCase() + '.' : ''}`.trim();

    const upper = (value: string | undefined, max = 40) =>
      (value ?? '').toUpperCase().substring(0, max);

    const sanitizeNumber = (value?: string | number): string =>
      value == null || value === '' ? '' : String(value);

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Item Labels - ${data.controlNumber}</title>
  <style>
    @page { size: 1.51in 1.30in; margin: 0; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .label {
      width: 1.51in;
      height: 1.30in;
      padding: 0.05in;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      page-break-after: always;
      font-size: 7pt;
      line-height: 1.1;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }
    .row.top { font-weight: bold; font-size: 8pt; }
    .row.mid { font-size: 7pt; }
    .row.desc { font-size: 6.5pt; }
    .row.code { font-size: 6pt; color: #555; margin-bottom: 2px; }
    .row.footer { margin-top: auto; flex-direction: column; align-items: center; }
    .control-number { font-family: 'Courier New', monospace; font-size: 11pt; letter-spacing: 1px; font-weight: bold; }
    .barcode { font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 18pt; line-height: 1; }
    .sequence { font-size: 6pt; font-weight: bold; margin-top: 1px; }
  </style>
</head>
<body>
  ${data.items.map((item, idx) => {
    const specsLeft = upper(item.categoryLabel ?? item.category ?? item.brand ?? '', 26);
    const specsRightParts = [
      sanitizeNumber(item.quantity) && Number(item.quantity) > 1 ? `${item.quantity}` : '',
      upper(item.karat, 6),
      upper(item.length ? `${item.length}"` : '', 6)
    ].filter(Boolean);

    const detailRightParts = [
      item.weight ? `${item.weight}${item.weightUnit ?? ''}`.toUpperCase() : '',
      upper(item.typeCode, 8)
    ].filter(Boolean);

    const description = upper(item.description, 70);
    const descriptionLeft = description.substring(0, 32);
    const descriptionRight = description.length > 32 ? description.substring(32, 60) : '';

    return `
    <div class="label">
      <div class="row top">
        <span>${upper(customerLine, 26)}</span>
        <span>${typeCode} ${txnDate}</span>
      </div>
      <div class="row mid">
        <span>${specsLeft}</span>
        <span>${specsRightParts.join(' ')}</span>
      </div>
      <div class="row desc">
        <span>${descriptionLeft}</span>
        <span>${detailRightParts.join(' ')}</span>
      </div>
      <div class="row desc">
        <span>${descriptionRight}</span>
        <span></span>
      </div>
      <div class="row code">
        <span>CODE: ___</span>
        <span>${item.amount ? `$${parseFloat(item.amount).toFixed(2)}` : ''}</span>
      </div>
      <div class="row footer">
        <div class="control-number">${item.inventoryNumber}</div>
        <div class="barcode">*${item.inventoryNumber}*</div>
        <div class="sequence">${idx + 1} of ${data.items.length}</div>
      </div>
    </div>`;
  }).join('')}
  <script>window.print();</script>
</body>
</html>`;
  }
}
