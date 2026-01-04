import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatDate, formatCurrency as formatMoney } from '@/lib/utils';
import { drawPdfHeader, drawStoreInfo, addPageNumbers } from '@/lib/pdfUtils';

export interface ForfeitItem {
    controlNumber: string;
    dateIn: string;
    dateOut: string;
    customer: string;
    phone: string;
    redemptionRatio: string;
    emp: string;
    lastPaid: string;
    itemDescription?: string;
    note: string;
    cost: number;
    items?: { itemDescription: string; cost: number }[];
}

export interface ForfeitReportData {
    buys: ForfeitItem[];
    pawns: ForfeitItem[];
    buysCosts: number;
    pawnsCosts: number;
    total: number;
}

export async function generateForfeitPdf(data: ForfeitReportData, dateRange: { from: string; to: string }): Promise<Blob> {
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
            renderHeader('Forfeit List');
            return true;
        }
        return false;
    };

    renderStoreInfo();
    renderHeader('Forfeit List');

    // Column Config - Custom Multi-line Layout
    const colWidths = {
        col1: 50,  // Ticket # / Paid
        col2: 350, // Dates / Customer / Desc / Note
        col3: 60,  // Phone
        col4: 20,  // Ratio
        col5: 80   // Emp / Cost (Right align cost)
    };

    const drawTableHeaders = () => {
        let x = margin;
        y -= 5;
        // Background for header
        page.drawRectangle({
            x: margin,
            y: y - 14,
            width: pageWidth - (margin * 2),
            height: lineHeight * 2 + 6,
            color: rgb(0.9, 0.9, 0.9),
        });

        // Line 1 Headers
        page.drawText('Ticket #', { x: x, y, size: fontSize, font: fontBold });
        x += colWidths.col1;

        page.drawText('Date In          Date Out        Customer', { x: x, y, size: fontSize, font: fontBold });
        x += colWidths.col2;

        page.drawText('Phone', { x: x, y, size: fontSize, font: fontBold });
        x += colWidths.col3;

        page.drawText('Ratio', { x: x, y, size: fontSize, font: fontBold });
        x += colWidths.col4;

        // Right Align Emp
        const empText = 'Emp';
        const empWidth = fontBold.widthOfTextAtSize(empText, fontSize);
        page.drawText(empText, { x: pageWidth - margin - empWidth - 5, y, size: fontSize, font: fontBold });

        // Line 2 Headers
        y -= 12;
        x = margin;

        page.drawText('Last Paid', { x: x, y, size: fontSize, font: fontBold });
        x += colWidths.col1;

        page.drawText('Item Description                                Note', { x: x, y, size: fontSize, font: fontBold });
        x += colWidths.col2 + colWidths.col3 + colWidths.col4;

        // Cost is in the last column
        const costText = 'Cost';
        const costWidth = fontBold.widthOfTextAtSize(costText, fontSize);
        page.drawText(costText, { x: pageWidth - margin - costWidth - 5, y, size: fontSize, font: fontBold });

        y -= lineHeight + 5;
    };

    const drawSection = (title: string, items: ForfeitItem[], totalCost: number) => {
        checkPageBreak(5); // Need more space for multi-line headers
        page.drawText(title, { x: margin, y, size: 12, font: fontBold });
        y -= 15;
        drawTableHeaders();

        items.forEach(item => {
            const subItems = item.items && item.items.length > 0
                ? item.items
                : [{ itemDescription: item.itemDescription || '', cost: item.cost }];

            // Calculate needed space: 1 line (Header) + N lines (SubItems) + 1 line (Separator)
            const neededLines = 1 + subItems.length + 1;

            if (checkPageBreak(neededLines)) {
                drawTableHeaders();
            }

            const itemY = y;
            let x = margin;

            // --- HEADER LINE (Common Info) ---
            // Col 1: Control #
            page.drawText(item.controlNumber || '', { x, y: itemY, size: fontSize, font });

            // Col 2: Date In / Out / Customer
            x += colWidths.col1;
            const dateIn = formatDate(item.dateIn);
            const dateOut = formatDate(item.dateOut);
            const customer = item.customer || '';
            const line1Text = `${dateIn}\t${dateOut}\t${customer}`;
            const displayLine1 = line1Text.length > 55 ? line1Text.substring(0, 52) + '...' : line1Text;
            page.drawText(displayLine1, { x, y: itemY, size: fontSize, font });

            // Col 3: Phone
            x += colWidths.col2;
            page.drawText(item.phone || '', { x, y: itemY, size: fontSize, font });

            // Col 4: Ratio
            x += colWidths.col3;
            page.drawText(item.redemptionRatio || '', { x, y: itemY, size: fontSize, font });

            // Col 5: Emp (Right Aligned)
            x += colWidths.col4;
            const empVal = item.emp || '';
            const empWidth = font.widthOfTextAtSize(empVal, fontSize);
            page.drawText(empVal, { x: pageWidth - margin - empWidth - 5, y: itemY, size: fontSize, font });

            // Move down for items
            y -= lineHeight;

            // --- SUB-ITEMS LOOP ---
            subItems.forEach((subItem, index) => {
                const subY = y;
                x = margin;

                // Col 1: Last Paid (Only on first item line)
                if (index === 0) {
                    console.log({ lastPaid: item.lastPaid, format: formatDate(item.lastPaid) })
                    page.drawText(formatDate(item.lastPaid), { x, y: subY, size: fontSize, font });
                }
                x += colWidths.col1;

                // Col 2: Description + Note
                // Note only on first item line?
                const desc = (subItem.itemDescription || '').padEnd(35, ' ');
                const note = (index === 0 ? (item.note || '') : '');
                const line2Text = `${desc}   ${note}`;
                const displayLine2 = line2Text.length > 55 ? line2Text.substring(0, 52) + '...' : line2Text;
                page.drawText(displayLine2, { x, y: subY, size: fontSize, font });

                // Col 5: Cost (Right Aligned)
                const costVal = formatMoney(subItem.cost);
                const costWidth = font.widthOfTextAtSize(costVal, fontSize);
                page.drawText(costVal, { x: pageWidth - margin - costWidth - 5, y: subY, size: fontSize, font });

                y -= lineHeight;
            });

            // Separator line
            page.drawLine({
                start: { x: margin, y: y + 7 },
                end: { x: pageWidth - margin, y: y + 7 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8),
            });
            y -= 2; // Extra padding
        });

        checkPageBreak(2);
        y -= 5;
        page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        y -= 15;
        page.drawText(`${title} Total:`, { x: pageWidth - margin - 150, y, size: 10, font: fontBold });
        page.drawText(formatMoney(totalCost), { x: pageWidth - margin - 50, y, size: 10, font: fontBold });
        y -= 25;
    };

    if (data.pawns && data.pawns.length > 0) {
        drawSection('Pawns', data.pawns, data.pawnsCosts);
    }

    if (data.buys && data.buys.length > 0) {
        drawSection('Buys', data.buys, data.buysCosts);
    }

    checkPageBreak(2);
    y -= 10;
    page.drawText('Grand Total:', { x: pageWidth - margin - 150, y, size: 12, font: fontBold });
    page.drawText(formatMoney(data.total), { x: pageWidth - margin - 50, y, size: 12, font: fontBold });

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
