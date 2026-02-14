import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatCurrency as formatMoney } from '@/lib/utils';
import { drawPdfHeader, drawStoreInfo, addPageNumbers } from '@/lib/pdfUtils';
import { TaxSalesReportData } from '@/app/core/api/reportsApi';

export async function generateTaxSalesPdf(data: TaxSalesReportData, dateRange: { from: string; to: string }, onlyTotals: boolean): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Portrait setup
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 30;
    const fontSize = 8;
    const lineHeight = 12;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const renderHeader = (title: string) => {
        y = drawPdfHeader({
            page,
            title,
            dateRange,
            pageWidth,
            pageHeight,
            margin,
            font,
            fontBold
        });
    };

    const renderStoreInfo = () => {
        drawStoreInfo({
            page,
            pageWidth,
            pageHeight,
            margin,
            font,
            fontBold
        });
    };

    const checkPageBreak = (neededLines: number = 1) => {
        if (y - (neededLines * lineHeight) < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            renderHeader('Sales Tax Report');
            return true;
        }
        return false;
    };

    renderStoreInfo();
    renderHeader('Sales Tax Report');

    // Column Config
    const colWidths = {
        date: 60,
        type: 80,
        ticket: 80,
        gross: 80,
        taxable: 80,
        collected: 80
    };

    if (!onlyTotals) {
        const drawTableHeaders = () => {
            let x = margin;
            y -= 5;
            // Background for header
            page.drawRectangle({
                x: margin,
                y: y - 2,
                width: pageWidth - (margin * 2),
                height: lineHeight + 4,
                color: rgb(0.9, 0.9, 0.9),
            });

            page.drawText('Date', { x, y, size: fontSize, font: fontBold });
            x += colWidths.date;

            page.drawText('Type', { x, y, size: fontSize, font: fontBold });
            x += colWidths.type;

            page.drawText('Ticket #', { x, y, size: fontSize, font: fontBold });
            x += colWidths.ticket;

            // Right align numeric headers roughly
            page.drawText('Gross Amount', { x: x + 20, y, size: fontSize, font: fontBold });
            x += colWidths.gross;

            page.drawText('Taxable Amount', { x: x + 10, y, size: fontSize, font: fontBold });
            x += colWidths.taxable;

            page.drawText('Tax Collected', { x: x + 10, y, size: fontSize, font: fontBold });

            y -= lineHeight + 5;
        };

        drawTableHeaders();

        data.rows.forEach(row => {
            if (checkPageBreak(1)) {
                drawTableHeaders();
            }

            let x = margin;

            // Date
            page.drawText(row.date, { x, y, size: fontSize, font });
            x += colWidths.date;

            // Type
            page.drawText(row.type, { x, y, size: fontSize, font });
            x += colWidths.type;

            // Ticket
            page.drawText(row.ticketNumber, { x, y, size: fontSize, font });
            x += colWidths.ticket;

            // Gross (Right Align)
            const grossVal = formatMoney(row.grossAmount);
            const grossWidth = font.widthOfTextAtSize(grossVal, fontSize);
            page.drawText(grossVal, { x: x + colWidths.gross - grossWidth - 10, y, size: fontSize, font });
            x += colWidths.gross;

            // Taxable (Right Align)
            const taxableVal = formatMoney(row.taxableAmount);
            const taxableWidth = font.widthOfTextAtSize(taxableVal, fontSize);
            page.drawText(taxableVal, { x: x + colWidths.taxable - taxableWidth - 10, y, size: fontSize, font });
            x += colWidths.taxable;

            // Collected (Right Align)
            const collectedVal = formatMoney(row.taxCollected);
            const collectedWidth = font.widthOfTextAtSize(collectedVal, fontSize);
            page.drawText(collectedVal, { x: x + colWidths.collected - collectedWidth - 10, y, size: fontSize, font });

            y -= lineHeight;
        });

        y -= 20;
    }

    // Totals Section
    checkPageBreak(15);
    page.drawText('Totals Summary', { x: margin, y, size: 12, font: fontBold });
    y -= 20;

    const drawTotalLine = (label: string, value: number, isCurrency: boolean = true) => {
        page.drawText(label, { x: margin, y, size: 10, font });
        const valStr = isCurrency ? formatMoney(value) : value.toString();
        const valWidth = fontBold.widthOfTextAtSize(valStr, 10);
        page.drawText(valStr, { x: 300 - valWidth, y, size: 10, font: fontBold });
        y -= 15;
    };

    drawTotalLine('Gross Sales:', data.totals.grossSales);
    drawTotalLine('Exempt Sales:', data.totals.exemptSales);
    drawTotalLine('Taxable Sales:', data.totals.taxableSales);
    y -= 5;
    drawTotalLine('State Tax Collected:', data.totals.stateTax.collected);
    drawTotalLine('State Tax Calculated:', data.totals.stateTaxCalculated);
    drawTotalLine('State Collection Allowance:', data.totals.collectionAllowances.stateTax);
    y -= 5;

    // Highlight Amount Due
    page.drawRectangle({
        x: margin - 5,
        y: y - 5,
        width: 310,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
    });
    page.drawText('Amount Due with Return:', { x: margin, y, size: 10, font: fontBold });
    const amountDueVal = formatMoney(data.totals.amountDueWithReturn);
    const amountDueWidth = fontBold.widthOfTextAtSize(amountDueVal, 10);
    page.drawText(amountDueVal, { x: 300 - amountDueWidth, y, size: 10, font: fontBold });


    addPageNumbers({
        pdfDoc,
        pageWidth,
        margin,
        fontSize: 6,
        font
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
}
