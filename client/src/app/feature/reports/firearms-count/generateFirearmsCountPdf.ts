import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { drawPdfHeader, drawStoreInfo, addPageNumbers } from '@/lib/pdfUtils';
import { FirearmsCountReportData, FirearmsItem } from '@/app/core/api/reportsApi';

export async function generateFirearmsCountPdf(
    data: FirearmsCountReportData,
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
            dateRange: null,
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
    renderHeader('Firearms Count Report', true);

    // Column Config
    // 1. Inv # / Type
    // 2. Serial # / Brand
    // 3. Ticket #
    // 4. Model / Customer
    // 5. Caliber
    // 6. Action

    const colWidths = {
        col1: 100, // Inv # / Type
        col2: 100, // Serial / Brand
        col3: 60,  // Ticket #
        col4: 150, // Model / Customer
        col5: 60,  // Caliber
        col6: 80   // Action
    };
    // Total: 100+100+60+150+60+80 = 550. Fits in 552.

    const checkPageBreak = (neededLines: number = 3) => {
        const neededHeight = (neededLines * lineHeight) + 20; // +20 for potential table header
        if (y - neededHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            renderHeader('Firearms Count Report', false);
            return true;
        }
        return false;
    };

    const drawTableHeaders = () => {
        // Background for header (2 lines high)
        page.drawRectangle({
            x: margin,
            y: y - lineHeight - 4,
            width: pageWidth - (margin * 2),
            height: (lineHeight * 2) + 6,
            color: rgb(0.9, 0.9, 0.9),
        });

        const textY = y;
        // Line 1 Headers
        page.drawText('Inv #', { x: margin, y: textY, size: fontSize, font: fontBold });
        page.drawText('Serial #', { x: margin + colWidths.col1, y: textY, size: fontSize, font: fontBold });
        page.drawText('Ticket #', { x: margin + colWidths.col1 + colWidths.col2, y: textY, size: fontSize, font: fontBold });
        page.drawText('Model', { x: margin + colWidths.col1 + colWidths.col2 + colWidths.col3, y: textY, size: fontSize, font: fontBold });
        page.drawText('Caliber', { x: margin + colWidths.col1 + colWidths.col2 + colWidths.col3 + colWidths.col4, y: textY, size: fontSize, font: fontBold });
        page.drawText('Action', { x: margin + colWidths.col1 + colWidths.col2 + colWidths.col3 + colWidths.col4 + colWidths.col5, y: textY, size: fontSize, font: fontBold });

        // Line 2 Headers
        const textY2 = y - lineHeight;
        page.drawText('Type', { x: margin, y: textY2, size: fontSize, font: fontBold });
        page.drawText('Brand', { x: margin + colWidths.col1, y: textY2, size: fontSize, font: fontBold });
        // Ticket # blank on line 2
        page.drawText('Customer', { x: margin + colWidths.col1 + colWidths.col2 + colWidths.col3, y: textY2, size: fontSize, font: fontBold });
        // Caliber/Action blank on line 2

        y -= (lineHeight * 2) + 5;
    };

    // Helper for aligned text
    const drawCell = (text: string | number, x: number, width: number, alignRight = false, fontToUse = font, customY: number | null = null) => {
        let str = String(text || '');
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

    const renderTable = (sectionTitle: string, items: FirearmsItem[]) => {
        if (!items || items.length === 0) return;

        checkPageBreak(3);

        // Section Title
        page.drawText(sectionTitle, { x: margin, y, size: 12, font: fontBold });
        y -= 20;

        drawTableHeaders();

        items.forEach(row => {
            checkPageBreak(2);

            const y1 = y;
            const y2 = y - lineHeight;

            let x = margin;

            // Col 1: Inv # (Line 1) / Type (Line 2)
            drawCell(row.inventoryNum, x, colWidths.col1, false, font, y1);
            drawCell(row.type, x, colWidths.col1, false, font, y2);
            x += colWidths.col1;

            // Col 2: Serial (Line 1) / Brand (Line 2)
            drawCell(row.serial, x, colWidths.col2, false, font, y1);
            drawCell(row.brand, x, colWidths.col2, false, font, y2);
            x += colWidths.col2;

            // Col 3: Ticket # (Line 1)
            drawCell(row.ticketNumber, x, colWidths.col3, false, font, y1);
            x += colWidths.col3;

            // Col 4: Model (Line 1) / Customer (Line 2)
            drawCell(row.model, x, colWidths.col4, false, font, y1);
            drawCell(row.customer, x, colWidths.col4, false, font, y2);
            x += colWidths.col4;

            // Col 5: Caliber (Line 1)
            drawCell(row.caliber, x, colWidths.col5, false, font, y1);
            x += colWidths.col5;

            // Col 6: Action (Line 1)
            drawCell(row.Action, x, colWidths.col6, false, font, y1);

            y -= (lineHeight * 2) + 5;
        });

        y -= 10;
    };

    // Render tables in order
    renderTable('Inventory', data.inventory);
    renderTable('Pawn', data.pawn);
    renderTable('Buy', data.buy);
    renderTable('Layaway', data.layaway);
    renderTable('Police Hold', data.policeHold);
    renderTable('Hold Period', data.holdPeriod);

    // Totals Summary
    checkPageBreak(8); // Need space for ~7 lines

    y -= 10;
    page.drawText('Gun Counts', { x: margin, y, size: 12, font: fontBold });
    y -= 20;

    const summaryX = margin + 20;
    const gap = 15;

    const drawTotal = (label: string, value: number) => {
        page.drawText(`${label}: ${value}`, { x: summaryX, y, size: 10, font });
        y -= gap;
    };

    if (data.totals) {
        drawTotal('Inventory', data.totals.inventory);
        drawTotal('Pawn', data.totals.pawn);
        drawTotal('Buy', data.totals.buy);
        drawTotal('Layaway', data.totals.layaway);
        drawTotal('Police Hold', data.totals.policeHold);
        drawTotal('Hold Period', data.totals.holdPeriod);

        y -= 5;
        page.drawText(`Total Guns in shop: ${data.totals.total}`, { x: summaryX, y, size: 10, font: fontBold });
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
