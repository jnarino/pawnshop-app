import { PDFPage, PDFFont, rgb } from 'pdf-lib';
import { formatDate } from './utils';

interface DrawHeaderOptions {
    page: PDFPage;
    title: string;
    dateRange: { from: string; to: string };
    pageWidth: number;
    pageHeight: number;
    margin: number;
    font: PDFFont;
    fontBold: PDFFont;
}

export function drawPdfHeader({
    page,
    title,
    dateRange,
    pageWidth,
    pageHeight,
    margin,
    font,
    fontBold
}: DrawHeaderOptions): number {
    let y = pageHeight - margin;

    page.drawText(title, { x: margin, y, size: 10, font: fontBold });
    y -= 10;

    page.drawText(`From: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`, { x: margin, y, size: 8, font });
    y -= 15;

    page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth / 2, y },
        color: rgb(0, 0, 0),
        thickness: 1,
    });
    y -= 15;

    page.drawText(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { x: margin, y, size: 10, font });
    y -= 25;

    return y;
}

interface DrawStoreInfoOptions {
    page: PDFPage;
    pageWidth: number;
    pageHeight: number;
    margin: number;
    font: PDFFont;
    fontBold: PDFFont;
}

export function drawStoreInfo({
    page,
    pageWidth,
    pageHeight,
    margin,
    font,
    fontBold
}: DrawStoreInfoOptions): number {
    let y = pageHeight - margin;
    const x = pageWidth - 210;

    page.drawText('LARRY\'S ESTATE JEWELRY & PAWN', { x, y, size: 10, font: fontBold });
    y -= 15;

    page.drawText('3316 CLEVELAND AVE.', { x, y, size: 10, font });
    y -= 15;

    page.drawText('FORT MYERS, FL 33901', { x, y, size: 10, font });
    y -= 15;

    page.drawText('(239) 939-3633', { x, y, size: 10, font });
    y -= 15;

    return y;
}

export interface AddPageNumbersOptions {
    pdfDoc: import('pdf-lib').PDFDocument;
    pageWidth: number;
    margin: number;
    fontSize: number;
    font: PDFFont;
}

export function addPageNumbers({
    pdfDoc,
    pageWidth,
    margin,
    fontSize,
    font
}: AddPageNumbersOptions): void {
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((p, idx) => {
        const text = `Page: ${idx + 1} of ${totalPages}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        // Right align page number
        p.drawText(text, {
            x: pageWidth - margin - textWidth,
            y: 15,
            size: fontSize,
            font: font
        });

        // Left align store name
        p.drawText('LARRY\'S ESTATE JEWELRY & PAWN', {
            x: margin,
            y: 15,
            size: fontSize,
            font
        });
    });
}
