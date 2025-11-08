import type { TransactionPrintData, PrintResult } from './types';

export interface LabelPrintData {
  inventoryNumber: string;
  description: string;
  amount: string;
  controlNumber: string;
  itemId?: string;
  labelIndex?: number;
  totalLabels?: number;
}

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

  /**
   * Print multiple individual labels with specified quantities
   */
  async printMultiple(labels: LabelPrintData[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[LabelPrinter] Printing ${labels.length} labels`);
      
      // Electron: Send to GoDEX printer via IPC
      if (window.electronAPI?.printLabels) {
        // Convert to format expected by Electron API
        const electronLabels = labels.map(label => ({
          inventoryNumber: label.inventoryNumber,
          description: label.description,
          amount: label.amount,
          controlNumber: label.controlNumber
        }));
        const result = await window.electronAPI.printLabels(electronLabels);
        return { success: result.success, error: result.error };
      }

      // Browser: Generate HTML for each label
      const html = this.generateMultipleLabelsHTML(labels);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      
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
      border: 1px solid #ccc; /* ✅ Visual border for testing */
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
        <div class="control-number">${data.controlNumber}</div>
        <div class="barcode">*${item.inventoryNumber}*</div>
        <div class="sequence">${idx + 1} of ${data.items.length}</div>
      </div>
    </div>`;
  }).join('')}
  <script>window.print();</script>
</body>
</html>`;
  }

  private generateMultipleLabelsHTML(labels: LabelPrintData[]): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Pawn Labels</title>
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
      border: 1px solid #ccc; /* ✅ Visual border for testing */
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }
    .row.top { font-weight: bold; font-size: 8pt; }
    .row.desc { font-size: 6.5pt; }
    .row.code { font-size: 6pt; color: #555; margin-bottom: 2px; }
    .row.footer { margin-top: auto; flex-direction: column; align-items: center; }
    .control-number { font-family: 'Courier New', monospace; font-size: 11pt; letter-spacing: 1px; font-weight: bold; }
    .barcode { font-family: 'Libre Barcode 39', 'Courier New', monospace; font-size: 18pt; line-height: 1; }
    .sequence { font-size: 6pt; font-weight: bold; margin-top: 1px; }
  </style>
</head>
<body>
  ${labels.map((label, idx) => {
    const description = (label.description || 'NO DESCRIPTION').toUpperCase().substring(0, 70);
    const descriptionLeft = description.substring(0, 32);
    const descriptionRight = description.length > 32 ? description.substring(32, 60) : '';

    return `
    <div class="label">
      <div class="row top">
        <span>PAWN LABEL</span>
        <span>${new Date().toLocaleDateString()}</span>
      </div>
      <div class="row desc">
        <span>${descriptionLeft}</span>
        <span></span>
      </div>
      <div class="row desc">
        <span>${descriptionRight}</span>
        <span></span>
      </div>
      <div class="row code">
        <span>CONTROL: ${label.controlNumber}</span>
        <span>${label.amount ? `$${parseFloat(label.amount).toFixed(2)}` : ''}</span>
      </div>
      <div class="row footer">
        <div class="control-number">${label.inventoryNumber}</div>
        <div class="barcode">*${label.inventoryNumber}*</div>
        <div class="sequence">Label ${idx + 1} of ${labels.length}</div>
      </div>
    </div>`;
  }).join('')}
  <script>window.print();</script>
</body>
</html>`;
  }

  private async printSingleLabel(label: LabelPrintData): Promise<void> {
    console.log('[LabelPrinter] Printing label:', {
      controlNumber: label.controlNumber,
      inventoryNumber: label.inventoryNumber,
      description: label.description,
      amount: label.amount
    });

    // ✅ Here's where you'd send to your actual thermal printer
    // The label would include:
    // - Control Number: ${label.controlNumber}
    // - Inventory Number: ${label.inventoryNumber}  
    // - Description: ${label.description}
    // - Amount: ${label.amount}
    
    // Example GoDEX printer command might look like:
    // await printerAPI.print({
    //   template: 'pawn-label',
    //   data: {
    //     controlNumber: label.controlNumber,
    //     inventoryNumber: label.inventoryNumber,
    //     description: label.description,
    //     amount: label.amount
    //   }
    // });
  }
}
