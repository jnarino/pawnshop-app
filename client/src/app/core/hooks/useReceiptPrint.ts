
import { useCallback, useState } from 'react';
import { ReceiptPrinter, ReceiptPrintData } from '../printing/ReceiptPrinter';
import { formatDate } from '@/lib/utils';

export function useReceiptPrint() {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState<string | null>(null);

    const printReceipt = useCallback(async (data: any, type: 'SALE' | 'REDEMPTION') => {
        setIsPrinting(true);
        setPrintError(null);

        try {

            const customer = data.customer;
            const printData: ReceiptPrintData = {
                type,
                ticketNumber: data.controlNumber || data.ticketNumber || 'N/A',
                amount: data.amount ?? 0,
                employee: data.clerkUsername || 'N/A',
                date: formatDate(data.newDate || new Date().toISOString()),
                customer: {
                    firstName: customer?.firstName || '',
                    middleName: customer?.middleName || '',
                    lastName: customer?.lastName || '',
                    address: customer?.streetAddress || '',
                    city: customer?.city || '',
                    state: customer?.stateUs || '',
                    zip: customer?.zipCode || '',
                    phone: customer?.phoneNumber || '',
                    dob: customer?.dateOfBirth ? formatDate(customer?.dateOfBirth) : '',
                    idType: customer?.idType || '',
                    idNumber: customer?.idNumber || '',
                },
                items: data.items || [],
                amountPaid: data.amountPaid ?? 0,
                dateRedeemed: data.newDate ? formatDate(data.newDate) : undefined,
                nextDueDate: data.nextDueDate ? formatDate(data.nextDueDate) : undefined,
                nextPayment: data.nextPaymentAmount ?? undefined
            };

            const printer = new ReceiptPrinter();
            console.log("printData", printData);
            const result = await printer.print(printData);

            if (!result.success) {
                setPrintError(result.error || 'Printing failed');
                return false;
            }
            return true;

        } catch (err) {
            console.error(err);
            setPrintError('Failed to prepare receipt data');
            return false;
        } finally {
            setIsPrinting(false);
        }
    }, []);

    return {
        printReceipt,
        isPrinting,
        printError
    };
}
