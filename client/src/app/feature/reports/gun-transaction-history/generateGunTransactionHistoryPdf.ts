import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatDate } from '@/lib/utils';
import { drawPdfHeader, drawStoreInfo, addPageNumbers } from '@/lib/pdfUtils';
import { GunTransactionHistoryItem } from '@/app/core/api/reportsApi';

export async function generateGunTransactionHistoryPdf(
    data: GunTransactionHistoryItem[],
    dateRange: { from: string; to: string }
): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Portrait setup
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 30;
    const fontSize = 9;
    const lineHeight = 14;

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

    const checkPageBreak = (neededLines: number = 1) => {
        if (y - (neededLines * lineHeight) < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            renderHeader('Gun Transaction History Report', false);
            drawTableHeaders();
            return true;
        }
        return false;
    };

    // Column Config
    // 1. Date
    // 2. Ticket #
    // 3. Customer
    // 4. NSCI #
    // 5. Transaction #
    // 6. Inventory #

    const colWidths = {
        col1: 60,  // Date
        col2: 60,  // Ticket #
        col3: 130, // Customer
        col4: 80,  // NSCI #
        col5: 80,  // Transaction #
        col6: 80   // Inventory #
    };
    // Total approx: 60+60+130+80+80+80 = 490 (fits well within 552 printable width)

    const drawTableHeaders = () => {
        const headerY = y;

        // Background for header
        page.drawRectangle({
            x: margin,
            y: headerY - 4,
            width: pageWidth - (margin * 2),
            height: lineHeight + 6,
            color: rgb(0.9, 0.9, 0.9),
        });

        let x = margin;
        page.drawText('Date', { x, y: headerY, size: fontSize, font: fontBold });
        x += colWidths.col1;

        page.drawText('Ticket #', { x, y: headerY, size: fontSize, font: fontBold });
        x += colWidths.col2;

        page.drawText('Customer', { x, y: headerY, size: fontSize, font: fontBold });
        x += colWidths.col3;

        page.drawText('NSCI #', { x, y: headerY, size: fontSize, font: fontBold });
        x += colWidths.col4;

        page.drawText('Transaction #', { x, y: headerY, size: fontSize, font: fontBold });
        x += colWidths.col5;

        page.drawText('Inventory #', { x, y: headerY, size: fontSize, font: fontBold });

        y -= lineHeight + 10;
    };

    // Initial Render
    renderStoreInfo();
    renderHeader('Gun Transaction History Report', true);
    drawTableHeaders();

    // Render Rows
    data.forEach((item, index) => {
        checkPageBreak(1);

        let x = margin;

        // Date
        const dateStr = formatDate(item.date);
        page.drawText(dateStr, { x, y, size: fontSize, font });
        x += colWidths.col1;

        // Ticket #
        page.drawText(item.ticketNumber || '', { x, y, size: fontSize, font });
        x += colWidths.col2;

        // Customer (truncate if needed)
        let cust = item.customer || '';
        if (cust.length > 20) cust = cust.substring(0, 18) + '..';
        page.drawText(cust, { x, y, size: fontSize, font });
        x += colWidths.col3;

        // NSCI #
        page.drawText(item.nsciNumber || '', { x, y, size: fontSize, font });
        x += colWidths.col4;

        // Transaction #
        page.drawText(item.transactionNumber || '', { x, y, size: fontSize, font });
        x += colWidths.col5;

        // Inventory #
        page.drawText(item.inventoryNumber || '', { x, y, size: fontSize, font });

        y -= lineHeight;


    });

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
