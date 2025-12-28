import type { TransactionPrintData, PrintResult } from './types';

export interface LabelPrintData {
  controlNumber: string;
  customerName: string;
  transactionType: string;
  transactionDate: string;
  labelIndex: number;
  totalLabels: number;
  category?: string;
  subcategory?: string;
  color?: string;
  model?: string;
  serialNumber?: string;
}

export class LabelPrinter {
  /**
   * Print item labels to GoDEX thermal printer (2.5in x 1.0in)
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

  /**
   * Print multiple individual labels with specified quantities
   */
  async printMultiple(labels: LabelPrintData[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[LabelPrinter] Printing ${labels.length} labels`);

      const html = this.generateMultipleLabelsHTML(labels);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      printWindow.document.write(html);
      printWindow.document.close();

      return { success: true };
    } catch (error) {
      console.error('[LabelPrinter] Print failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Print failed'
      };
    }
  }

  private generateHTML(data: TransactionPrintData): string {
    const typeCode = data.ticketType === 'PAWN' ? 'P' : 'B';
    const d = new Date(data.transactionDate);
    const txnDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    const customerName = `${(data.customerLastName ?? '').toUpperCase()}, ${(data.customerFirst ?? '').toUpperCase()}`;

    const labels: LabelPrintData[] = data.items.map((item, idx) => ({
      controlNumber: data.controlNumber,
      customerName,
      transactionType: typeCode,
      transactionDate: txnDate,
      labelIndex: idx + 1,
      totalLabels: data.items.length,
      category: item.category,
      subcategory: item.subcategory,
      color: item.color,
      model: item.modelNumber,
      serialNumber: item.serialNumber,
    }));

    return this.renderLabels(labels);
  }

  private generateMultipleLabelsHTML(labels: LabelPrintData[]): string {
    const updatedLabels = labels.map((label, idx) => ({
      ...label,
      labelIndex: idx + 1,
      totalLabels: labels.length
    }));
    return this.renderLabels(updatedLabels);
  }

  private renderLabels(labels: LabelPrintData[]): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: 2.5in 1.0in; margin: 0; }
    body { margin: 0; padding: 0; font-family: monospace; }
    .label {
      width: 2.5in;
      height: 1.0in;
      padding: 0.1in 0.15in;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      page-break-after: always;
      font-size: 8pt;
      line-height: 1.1;
      overflow: hidden;
    }
    .row {
      display: flex;
      justify-content: flex-start;
      gap: 0.25in;
      white-space: nowrap;
      width: 100%;
      text-transform: uppercase;
    }
    .row.space-between {
      justify-content: space-between;
    }
    .barcode {
      font-family: 'Libre Barcode 39', 'Courier New', monospace;
      font-size: 24pt;
      text-align: center;
      line-height: 1;
      margin-top: -2px;
    }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  ${labels.map((label) => `
    <div class="label">
      <div class="row">
        <span>${label.customerName}</span>
        <span>${label.transactionType} ${label.transactionDate}</span>
      </div>
      <div class="row">
        <span>${label.subcategory || ''}${label.category ? ', ' + label.category : ''}</span>
      </div>
      <div class="row">
        <span>${label.color || ''}</span>
      </div>
      <div class="row space-between">
        <span>${label.model || ''}</span>
        <span>${label.serialNumber || ''}</span>
      </div>
      <div class="row space-between">
        <span class="bold">${label.controlNumber}</span>
        <span>${label.labelIndex} OF ${label.totalLabels}</span>
      </div>
      <div class="barcode">*${label.controlNumber}*</div>
    </div>`).join('')}
  <script>window.print();</script>
</body>
</html>`;
  }
}
