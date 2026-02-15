import type { TransactionPrintData, PrintResult } from './types';
import JsBarcode from 'jsbarcode';

export interface LabelPrintData {
  controlNumber: string;
  customerName: string;
  transactionType: string;
  transactionDate: string;
  labelIndex: number;
  totalLabels: number;
  category?: string;
  subcategory?: string;
  description: string;
  model?: string;
  serialNumber?: string;
  barcodeDataUrl?: string;
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

      // NOTE: We are skipping the electronAPI.printLabels stub because it does not implement printing yet.
      // Falling back to browser print window.
      // if (window.electronAPI?.printLabels) {
      //   return await window.electronAPI.printLabels(data.items);
      // }

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
      description: item.description,
      model: item.modelNumber,
      serialNumber: item.serialNumber,
      barcodeDataUrl: data.controlNumber ? this.generateBarcodeBase64(data.controlNumber) : undefined,
    }));

    return this.renderLabels(labels);
  }

  private generateMultipleLabelsHTML(labels: LabelPrintData[]): string {
    const updatedLabels = labels.map((label, idx) => ({
      ...label,
      labelIndex: idx + 1,
      totalLabels: labels.length,
      barcodeDataUrl: label.controlNumber ? this.generateBarcodeBase64(label.controlNumber) : label.barcodeDataUrl
    }));
    return this.renderLabels(updatedLabels);
  }

  private generateBarcodeBase64(value: string): string {
    if (!value) return '';
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, value, {
        format: 'CODE39',
        displayValue: false,
        height: 60,
        margin: 0,
        width: 2,
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Barcode generation failed:', e);
      return '';
    }
  }

  private renderLabels(labels: LabelPrintData[]): string {
    const noneIfEmpty = (val?: string) => (!val || val.trim() === '' ? 'NONE' : val);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: 2.6in 1.6in; margin: 0; }
    body { margin: 0; padding: 0; font-family: monospace; }
    .label {
      width: 2.6in;
      height: 1.6in;
      padding: 0.05in 0.15in;
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
      justify-content: space-between;
      white-space: nowrap;
      width: 100%;
      text-transform: uppercase;
      gap: 0.1in;
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      text-align: left;
    }
    .date-type {
      flex-shrink: 0;
      text-align: right;
    }
    .barcode-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: auto;
      width: 100%;
      min-height: 0.3in;
    }
    .barcode {
      height: 0.35in;
      width: auto;
      max-width: 100%;
      display: block;
      margin: 0 auto;
    }
    .bold { font-weight: bold; }
    .sequence { font-size: 7.5pt; font-weight: bold; flex-shrink: 0; }
    .description {
      font-size: 7.5pt;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
  </style>
</head>
<body>
  ${labels.map((label) => `
    <div class="label">
      <div class="row">
        <span class="name">${label.customerName}</span>
        <span class="date-type">${label.transactionType} ${label.transactionDate}</span>
      </div>
      <div class="row">
        <span>${label.subcategory || ''}${label.category ? ', ' + label.category : ''}</span>
      </div>
      <div class="row">
        <span class="description">${label.description}</span>
      </div>
      <div class="row">
        <span>MODEL: ${noneIfEmpty(label.model)}</span>
        <span>SN: ${noneIfEmpty(label.serialNumber)}</span>
      </div>
      <div class="row">
        <span class="bold">${label.controlNumber}</span>
        <span class="sequence">${label.labelIndex} OF ${label.totalLabels}</span>
      </div>
      <div class="barcode-container">
        ${label.barcodeDataUrl ? `<img src="${label.barcodeDataUrl}" class="barcode" />` : ''}
      </div>
    </div>`).join('')}
  <script>window.print();</script>
</body>
</html>`;
  }
}
