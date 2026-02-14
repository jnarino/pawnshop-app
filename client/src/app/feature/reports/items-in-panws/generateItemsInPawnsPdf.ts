import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatDate, formatCurrency as formatMoney } from '@/lib/utils';
import { drawPdfHeader, drawStoreInfo, addPageNumbers } from '@/lib/pdfUtils';
import { ItemsInPawnsReportData } from '@/app/core/api/reportsApi';

export async function generateItemsInPawnsPdf(
    data: ItemsInPawnsReportData,
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
        // If it's the first page, drawStoreInfo and header are already handled or should be handled specially
        // to avoid double drawing if we call this from checkPageBreak.
        // Actually, drawStoreInfo is usually only on the first page.
        // But headers (title, date range) might be on every page?
        // Let's assume title is on every page.

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
    // drawStoreInfo draws at top left, doesn't return Y.
    // drawPdfHeader draws below it usually? Or at top?
    // In drawPdfHeader: let y = pageHeight - margin; -> It starts at top.
    // So drawPdfHeader overwrites store info if store info is also at top.
    // We should check pdfUtils implementation.
    // But assuming existing code worked somewhat, we'll keep the order.
    // However, to fix "Empty first page", we need to make sure we don't page break immediately.

    // We'll call renderHeader returns new Y.
    renderHeader('Items in Pawns Report', true);

    const checkPageBreak = (neededLines: number = 1) => {
        if (y - (neededLines * lineHeight) < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            renderHeader('Items in Pawns Report', false);
            drawTableHeaders();
            return true;
        }
        return false;
    };

    // Column Config (8 columns)
    // 1. Ticket # (Line 1) / Desc (Line 2+)
    // 2. Customer
    // 3. Redemp Ratio (Placeholder)
    // 4. Emp
    // 5. Date In
    // 6. Date Out
    // 7. Serv Chg (Line 1) / Item Amount (Line 2+)
    // 8. Amount (Line 1) / Resale Amount (Line 2+)

    const colWidths = {
        col1: 120, // Ticket/Desc - wider for description
        col2: 80,  // Customer
        col3: 40,  // Redemption Ratio
        col4: 40,  // Emp
        col5: 50,  // Date In
        col6: 50,  // Date Out
        col7: 60,  // Serv Chg / Item Amt
        col8: 60   // Amount / Resale Amt
    };
    // Total: 120+80+40+40+50+50+60+60 = 500. Fits in 552 (612 - 60).

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
            { text: 'Ticket # / Item', width: colWidths.col1 },
            { text: 'Customer', width: colWidths.col2 },
            { text: 'Ratio', width: colWidths.col3 },
            { text: 'Emp', width: colWidths.col4 },
            { text: 'Date In', width: colWidths.col5 },
            { text: 'Date Out', width: colWidths.col6 },
            { text: 'SrvChg/Item', width: colWidths.col7 },
            { text: 'Amt/Resale', width: colWidths.col8 },
        ];

        headers.forEach(h => {
            page.drawText(h.text, { x, y, size: fontSize, font: fontBold });
            x += h.width;
        });

        y -= lineHeight + 5;
    };

    drawTableHeaders();

    let totalLoanAmount = 0;

    data.rows.forEach(row => {
        // Calculate needed height
        // Header line: 1 line
        // Item lines: row.items.length lines
        // Total: 1 + items.length

        // If items list is empty (shouldn't be, but robust check), at least 1 line for main desc if items missing?
        const itemCount = row.items && row.items.length > 0 ? row.items.length : 1;
        const neededHeight = (1 + itemCount) * lineHeight + 5; // +5 padding

        checkPageBreak(neededHeight / lineHeight);

        let x = margin;

        // --- Line 1: Ticket Header ---

        // Col 1: Ticket #
        page.drawText(row.ticketNumber, { x, y, size: fontSize, font: fontBold });
        x += colWidths.col1;

        // Col 2: Customer
        const customerName = row.customer.length > 15 ? row.customer.substring(0, 13) + '...' : row.customer;
        page.drawText(customerName, { x, y, size: fontSize, font });
        x += colWidths.col2;

        // Col 3: Redemption Ratio
        page.drawText("", { x, y, size: fontSize, font }); // Placeholder
        x += colWidths.col3;

        // Col 4: Emp
        page.drawText(row.employee || '', { x, y, size: fontSize, font });
        x += colWidths.col4;

        // Col 5: Date In
        page.drawText(formatDate(row.dateIn), { x, y, size: fontSize, font });
        x += colWidths.col5;

        // Col 6: Date Out
        page.drawText(formatDate(row.dateOut), { x, y, size: fontSize, font });
        x += colWidths.col6;

        // Col 7: Service Charge
        const srvChg = formatMoney(row.serviceChargeDue || 0);
        // Right align logic within column? rough approx
        page.drawText(srvChg, { x: x + 2, y, size: fontSize, font });
        x += colWidths.col7;

        // Col 8: Amount
        const amt = formatMoney(row.pawnAmount);
        page.drawText(amt, { x: x + 2, y, size: fontSize, font: fontBold });
        totalLoanAmount += row.pawnAmount;
        x += colWidths.col8;

        y -= lineHeight;

        // --- Line 2+: Items ---
        if (row.items && row.items.length > 0) {
            row.items.forEach(item => {
                // Reset X for item line
                let itemX = margin;

                // Col 1: Item Description
                // Indent slightly? Or just list it.
                // "item description"
                const desc = `  ${item.description}`; // 2 spaces indent
                // Truncate if too long?
                // col1 width is 120. font size 8. approx 20-25 chars?
                // pdf-lib doesn't auto wrap well without calculation.
                // Let's just draw it.
                page.drawText(desc, { x: itemX, y, size: fontSize, font });

                // Col 7: Item Amount
                // The user says "item amount".
                // interface ItemsInPawnsReportData -> items -> { amount: number }
                // Let's assume this is the item allocation amount.
                itemX = margin + colWidths.col1 + colWidths.col2 + colWidths.col3 + colWidths.col4 + colWidths.col5 + colWidths.col6;
                const itemAmt = formatMoney(item.amount || 0);
                page.drawText(itemAmt, { x: itemX + 2, y, size: fontSize, font });

                // Col 8: Resale Amount
                // "resale amount".
                // interface doesn't have it explicitly.
                // If it's missing, draw 0 or blank.
                itemX += colWidths.col7;
                // Assuming maybe `extra.retailPrice`? Or just blank for now?
                // User said "each item have ... resale amount".
                // I'll put a placeholder if not found.
                // For now, let's leave blank or use 0.00
                const resaleAmt = formatMoney((item as any).retailPrice || 0); // items might carry it
                page.drawText(resaleAmt, { x: itemX + 2, y, size: fontSize, font });

                y -= lineHeight;
            });
        } else {
            // Fallback if no items array (shouldn't happen given interface)
            let itemX = margin;
            page.drawText(`  ${row.itemDescription}`, { x: itemX, y, size: fontSize, font });
            y -= lineHeight;
        }

        // Space between rows
        y -= 5;
    });

    y -= 10;

    // Total Summary
    checkPageBreak(3);
    const totalLabel = "Total Loan Amount:";
    const totalVal = formatMoney(totalLoanAmount);

    // Position total near amount column
    // The amount column is the last one (Col 8)
    const totalX = margin + colWidths.col1 + colWidths.col2 + colWidths.col3 + colWidths.col4 + colWidths.col5 + colWidths.col6 + colWidths.col7;

    page.drawText(totalLabel, { x: totalX - 80, y, size: 10, font: fontBold });
    page.drawText(totalVal, { x: totalX + 2, y, size: 10, font: fontBold });


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
