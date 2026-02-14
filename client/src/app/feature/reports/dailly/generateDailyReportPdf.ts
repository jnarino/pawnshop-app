import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatDate, formatCurrency as formatMoney } from '@/lib/utils';
import { CashDrawerDetailWithSummaryResponseDto } from '@/app/core/dto/CashDrawerReportDto';
import { drawPdfHeader, drawStoreInfo, addPageNumbers } from '@/lib/pdfUtils';

export async function generateDailyReportPdf(data: CashDrawerDetailWithSummaryResponseDto, dateRange: { from: string; to: string }, onlyTotals?: boolean): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Portrait setup
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 30;
    const fontSize = 6;
    const lineHeight = 12;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const renderHeader = () => {
        y = drawPdfHeader({
            page,
            title: 'Main Cash Drawer Detail',
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
            renderHeader();
            return true;
        }
        return false;
    };

    renderStoreInfo();
    renderHeader();

    // Column Config
    const colWidths = {
        col1: 60,  // Date & Time
        col2: 40,  // Ticket #
        col3: 40,  // Cust #
        col4: 20,  // Emp
        col5: 100, // Transaction Type
        col6: 60,  // Amount (Right align)
        col7: 120, // Remarks
        col8: 60   // Balance (Right align)
    };

    const drawTableHeaders = () => {
        let x = margin;
        y -= 5;
        // Background for header
        page.drawRectangle({
            x: margin,
            y: y - 15,
            width: pageWidth - (margin * 2),
            height: lineHeight + 10,
            color: rgb(0.9, 0.9, 0.9),
        });

        const headers = [
            { text: 'Date & Time', width: colWidths.col1 },
        ];

        headers.forEach(h => {
            page.drawText(h.text, { x, y, size: fontSize, font: fontBold });
            x += h.width;
        });

        // Ticket # (Right Align)
        let ticketText = 'Ticket #';
        let ticketW = fontBold.widthOfTextAtSize(ticketText, fontSize);
        page.drawText(ticketText, { x: x + colWidths.col2 - ticketW - 5, y, size: fontSize, font: fontBold });
        x += colWidths.col2;

        const headers2 = [
            { text: 'Cust #', width: colWidths.col3 },
            { text: 'Emp', width: colWidths.col4 },
            { text: 'Transaction Type', width: colWidths.col5 },
        ];

        headers2.forEach(h => {
            page.drawText(h.text, { x, y, size: fontSize, font: fontBold });
            x += h.width;
        });

        // Amount (Right Align)
        let amountX = x + colWidths.col6 - 5;
        let amountText = 'Amount';
        let w = fontBold.widthOfTextAtSize(amountText, fontSize);
        page.drawText(amountText, { x: amountX - w, y, size: fontSize, font: fontBold });
        x += colWidths.col6;

        page.drawText('Remarks', { x, y, size: fontSize, font: fontBold });
        x += colWidths.col7;

        // Balance (Right Align)
        let balX = pageWidth - margin - 5;
        let balText = 'Balance';
        w = fontBold.widthOfTextAtSize(balText, fontSize);
        page.drawText(balText, { x: balX - w, y, size: fontSize, font: fontBold });

        // Removed starting balance line from header logic when onlyTotals is true?
        // Actually, starting balance is usually printed in the header area or first line.
        // In previous code it was drawn here:
        if (!onlyTotals) {
            const startBalVal = formatMoney(data.summary.startingBalance);
            const startBalW = font.widthOfTextAtSize(startBalVal, fontSize);
            page.drawText(startBalVal, { x: balX - startBalW, y: y - lineHeight, size: fontSize, font });
        }

        y -= lineHeight + 15;
    };

    if (!onlyTotals) {
        drawTableHeaders();

        // Transactions
        data.transactions.forEach((tx) => {
            const dateTime = formatDate(tx.dateTime, true);
            const method = (tx.paymentMethod || '').toUpperCase();
            const neededLines = 2 + (tx.tenderChange > 0 ? 1 : 0);
            if (checkPageBreak(neededLines)) {
                drawTableHeaders();
            }

            let x = margin;
            const rowY = y;

            // Col 1: Date & Time / Method
            page.drawText(dateTime, { x, y: rowY, size: fontSize, font });
            page.drawText(method, { x, y: rowY - lineHeight, size: fontSize, font: fontBold });
            x += colWidths.col1;

            // Col 2: Ticket # (Right Align)
            const ticketNum = tx.ticketNumber || '';
            const ticketRowW = font.widthOfTextAtSize(ticketNum, fontSize);
            page.drawText(ticketNum, { x: x + colWidths.col2 - ticketRowW - 5, y: rowY, size: fontSize, font });
            x += colWidths.col2;

            // Col 3: Cust #
            page.drawText(tx.customerNumber || '', { x, y: rowY, size: fontSize, font });
            x += colWidths.col3;

            // Col 4: Emp
            page.drawText(tx.employee || '', { x, y: rowY, size: fontSize, font });
            x += colWidths.col4;

            // Col 5: Type
            page.drawText((tx.transactionType || '').toUpperCase(), { x, y: rowY, size: fontSize, font });
            x += colWidths.col5;

            // Col 6: Amount (Right Align)
            const amount = formatMoney(tx.amount);
            const amountW = font.widthOfTextAtSize(amount, fontSize);
            page.drawText(amount, { x: x + colWidths.col6 - amountW - 5, y: rowY, size: fontSize, font });

            if (tx.tenderChange > 0) {
                const change = `Change: ${formatMoney(tx.tenderChange)}`;
                const changeW = font.widthOfTextAtSize(change, fontSize);
                page.drawText(change, { x: x + colWidths.col6 - changeW - 5, y: rowY - lineHeight, size: fontSize, font });
            }
            x += colWidths.col6;

            // Col 7: Remarks
            // Simple truncation for remarks to fit one line
            const remarks = (tx.remarks || '').toUpperCase();
            const maxIdd = 26; // Approx chars
            const displayRemarks = remarks.length > maxIdd ? remarks.substring(0, maxIdd) + '...' : remarks;
            page.drawText(displayRemarks, { x, y: rowY, size: fontSize, font });
            x += colWidths.col7;

            // Col 8: Balance
            const balance = formatMoney(tx.balance);
            const balanceW = font.widthOfTextAtSize(balance, fontSize);

            // Simpler right align for balance
            page.drawText(balance, { x: pageWidth - margin - balanceW - 5, y: rowY, size: fontSize, font });

            // Separator
            y -= (lineHeight * 2);
            if (tx.tenderChange > 0) y -= lineHeight;

            page.drawLine({
                start: { x: margin, y: y + 8 },
                end: { x: pageWidth - margin, y: y + 8 },
                thickness: 0.5,
                color: rgb(0.9, 0.9, 0.9),
            });

        });
    }

    // Summary Section
    checkPageBreak(15);
    y -= 20;

    const summaryBoxWidth = (pageWidth - (margin * 2) - 20) / 3;
    let sx = margin;

    const drawSummaryRow = (label: string, value: string, bold = false, startY: number) => {
        const f = bold ? fontBold : font;
        page.drawText(label, { x: sx + 5, y: startY, size: fontSize, font: f });
        const valW = f.widthOfTextAtSize(value, fontSize);
        page.drawText(value, { x: sx + summaryBoxWidth - valW - 5, y: startY, size: fontSize, font: f });
        return startY - lineHeight;
    };

    const drawBoxedSection = (
        startX: number,
        startY: number,
        width: number,
        rows: { label: string, value: number, bold?: boolean }[],
        totalLabel: string,
        totalValue: number
    ) => {
        let curY = startY - 5;
        rows.forEach(r => {
            curY = drawSummaryRow(r.label, formatMoney(r.value), r.bold, curY);
        });

        // Total Line
        page.drawLine({
            start: { x: startX + 5, y: curY + 8 },
            end: { x: startX + width - 5, y: curY + 8 },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        curY = drawSummaryRow(totalLabel, formatMoney(totalValue), true, curY);

        // Border
        page.drawRectangle({
            x: startX,
            y: curY - 5,
            width: width,
            height: startY - curY + 5,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
        });

        return curY - 5; // Return Y below the box
    };

    // Sales Summary Box (Col 1)
    const salesConfig = [
        { label: 'Sales:', value: data.salesSummary.sales, bold: true },
        { label: 'Credit Sales:', value: data.salesSummary.creditSales },
        { label: 'Layaways:', value: data.salesSummary.layaways },
        { label: 'Repairs:', value: data.salesSummary.repairs },
    ];
    let col1Y = y;
    col1Y = drawBoxedSection(sx, col1Y, summaryBoxWidth, salesConfig, 'Total Sales:', data.salesSummary.totalSales);

    // Cash Added (Col 1, Gap)
    col1Y -= 10;
    const cashAdConfig = [
        { label: 'Cash Added:', value: data.cashAdded.cashAdded, bold: true },
        { label: 'Cash Added From Bank:', value: data.cashAdded.cashAddedFromBank },
        { label: 'From Employee Drawers:', value: data.cashAdded.fromEmployeeDrawers },
        { label: 'From Main Drawer:', value: data.cashAdded.fromMainDrawer },
    ];
    drawBoxedSection(sx, col1Y, summaryBoxWidth, cashAdConfig, 'Total Cash Added:', data.cashAdded.totalCashAdded);


    // Col 2
    sx += summaryBoxWidth + 10;
    let col2Y = y;

    // Buys (Col 2)
    const pbConfig = [
        { label: 'Buys:', value: data.pawnsBuys.buys, bold: true },
        { label: 'Pawns:', value: data.pawnsBuys.pawns },
        { label: 'Pawn Payments:', value: data.pawnsBuys.pawnPayments },
        { label: 'Pawn Redeems:', value: data.pawnsBuys.pawnRedeems },
    ];
    col2Y = drawBoxedSection(sx, col2Y, summaryBoxWidth, pbConfig, 'Total Pawns/Buys:', data.pawnsBuys.totalPawnsBuys);

    // Cash Out (Col 2, Gap)
    col2Y -= 10;
    const coConfig = [
        { label: 'Cash Removed:', value: data.cashOut.cashRemoved, bold: true },
        { label: 'Deposit to Bank:', value: data.cashOut.depositToBank },
        { label: 'To Employee Drawers:', value: data.cashOut.toEmployeeDrawers },
        { label: 'To Main Drawer:', value: data.cashOut.toMainDrawer },
    ];
    drawBoxedSection(sx, col2Y, summaryBoxWidth, coConfig, 'Total Cash Out:', data.cashOut.totalCashOut);


    // Global Summary (Col 3)
    sx += summaryBoxWidth + 10;
    let col3Y = y;
    const globalConfig = [
        { label: 'Starting Balance:', value: data.summary.startingBalance, bold: true },
        { label: 'Total Sales:', value: data.summary.totalSales },
        { label: 'Total Pawns/Buys:', value: data.summary.totalPawnsBuys },
        { label: 'Total Cash Added:', value: data.summary.totalCashAdded },
        { label: 'Total Cash Out:', value: data.summary.totalCashOut },
        { label: 'Customer Credits:', value: data.summary.customerCredits },
        { label: 'Cash Over/Short:', value: data.summary.cashOverShort },
    ];
    drawBoxedSection(sx, col3Y, summaryBoxWidth, globalConfig, 'Ending Balance:', data.summary.endingBalance);

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
