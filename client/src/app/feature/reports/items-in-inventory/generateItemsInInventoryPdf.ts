import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatDate, formatCurrency as formatMoney } from '@/lib/utils';
import { drawPdfHeader, drawStoreInfo, addPageNumbers } from '@/lib/pdfUtils';
import { InventoryReportData } from '@/app/core/api/reportsApi';

export async function generateItemsInInventoryPdf(
    data: InventoryReportData,
    dateRange: { from: string; to: string },
    options?: { exclude: boolean }
): Promise<Blob> {
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

    const renderHeader = (title: string, isFirstPage: boolean) => {
        if (!isFirstPage) {
            y = pageHeight - margin;
        }

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

    // Initial setup on first page
    renderStoreInfo();
    renderHeader('Items in Inventory Report', true);

    // Column Config
    // 1. Inv # (Width ~50)
    // 2. Details (Width ~340)
    //    Line 1: Item Type | Brand
    //    Line 2: Desc | Model | Serial
    // 3. Qty (Width ~30)
    // 4. Cost (Width ~60)
    // 5. Resale (Width ~60)

    // Total Width: 50 + 340 + 30 + 60 + 60 = 540. Fits in 552.

    const colWidths = {
        inv: 50,
        details: 340,
        qty: 30,
        cost: 60,
        resale: 60
    };

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

        const headers = [
            { text: 'Inv #', width: colWidths.inv },
            { text: 'Item type, brand ,desc, model and serial #', width: colWidths.details }, // Generic header for the complex column
            { text: 'Qty', width: colWidths.qty },
            { text: 'Cost', width: colWidths.cost },
            { text: 'Resale', width: colWidths.resale },
        ];

        headers.forEach((h, i) => {
            // Align Qty, Cost, Resale to right? 
            // Standard approach: draw text at x.
            // Adjust X for right alignment if needed later.
            page.drawText(h.text, { x, y, size: fontSize, font: fontBold });
            x += h.width;
        });

        y -= lineHeight + 5;
    };

    drawTableHeaders();

    const checkPageBreak = (neededLines: number = 2) => {
        const neededHeight = (neededLines * lineHeight) + 10;
        if (y - neededHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            renderHeader('Items in Inventory Report', false);
            drawTableHeaders();
            return true;
        }
        return false;
    };

    // Helper for aligned text
    const drawCell = (text: string | number, x: number, width: number, alignRight = false, fontToUse = font, customY: number | null = null) => {
        let str = String(text || '');
        // Truncate
        const maxChars = Math.floor(width / 4.5);
        if (str.length > maxChars) {
            str = str.substring(0, maxChars - 2) + '..';
        }

        const drawY = customY !== null ? customY : y;

        if (alignRight) {
            const textWidth = fontToUse.widthOfTextAtSize(str, fontSize);
            page.drawText(str, { x: x + width - textWidth - 2, y: drawY, size: fontSize, font: fontToUse });
        } else {
            page.drawText(str, { x, y: drawY, size: fontSize, font: fontToUse });
        }
        return width;
    };

    data.rows.forEach(row => {
        checkPageBreak(2);

        let x = margin;

        // Col 1: Inv #
        drawCell(row.inventoryNumber, x, colWidths.inv);
        x += colWidths.inv;

        // Col 2: Details (Complex)
        const detailsX = x;

        // Line 1: Item Type - Brand
        // We can just concatenate them with a separator
        const line1 = `${row.itemType} - ${row.brand}`;
        drawCell(line1, detailsX, colWidths.details, false);

        // Line 2: Desc - Model - Serial
        const line2 = `${row.itemDescription} - ${row.model} - ${row.serialNumber}`;
        // Draw line 2 one line below
        // Note: We need to draw side columns first or handle Y carefuly.
        // Let's just draw line 2 at y - lineHeight.

        // Col 3: Qty
        x += colWidths.details;
        drawCell(row.quantity, x, colWidths.qty, true);

        // Col 4: Cost
        x += colWidths.qty;
        drawCell(formatMoney(row.cost), x, colWidths.cost, true);

        // Col 5: Resale
        x += colWidths.cost;
        drawCell(formatMoney(row.resale), x, colWidths.resale, true);

        // Now draw Line 2 of Details
        // Fix: Draw at y - lineHeight
        drawCell(line2, detailsX, colWidths.details, false, font, y - lineHeight);

        y -= (lineHeight * 2);

        // Padding
        y -= 2;
    });

    y -= 10;

    // Total Summary
    checkPageBreak(5);
    const summaryX = margin + 20;
    const summaryY = y - 20;

    if (data.totals) {
        let currentY = summaryY;
        const gap = 15;

        page.drawText(`Total Items: ${data.totals.totalItems}`, { x: summaryX, y: currentY, size: 10, font });
        currentY -= gap;
        page.drawText(`Total Quantity: ${data.totals.totalQuantity}`, { x: summaryX, y: currentY, size: 10, font });
        currentY -= gap;
        page.drawText(`Total Cost: ${formatMoney(data.totals.totalCost)}`, { x: summaryX, y: currentY, size: 10, font: fontBold });
        currentY -= gap;
        page.drawText(`Total Resale: ${formatMoney(data.totals.totalResale)}`, { x: summaryX, y: currentY, size: 10, font: fontBold });
    }

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
