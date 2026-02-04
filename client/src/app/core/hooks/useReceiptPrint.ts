
import { useCallback, useState } from 'react';
import { ReceiptPrinter, ReceiptPrintData } from '../printing/ReceiptPrinter';
import { formatDate } from '@/lib/utils';
import { tenderTypeApi } from '../api/tenderTypeApi';

export function useReceiptPrint() {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState<string | null>(null);

    const printReceipt = useCallback(async (data: any, type: 'SALE' | 'REDEMPTION') => {
        setIsPrinting(true);
        setPrintError(null);

        const types = await tenderTypeApi.list();

        try {

            const customer = data.customer;
            const printData: ReceiptPrintData = {
                type,
                ticketNumber: data.controlNumber || data.ticketNumber || 'N/A',
                amount: type === 'SALE' ? (data.amount + (data.stateTax || 0)) : (data.amount ?? 0),
                subtotal: data.amount - (data.stateTax || 0),
                tax: data.stateTax,
                employee: data.clerkUsername || 'N/A',
                date: formatDate(data.newDate || data.occurredAt || new Date().toISOString()),
                time: new Date(data.newDate || data.occurredAt || new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
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
                tenders: data.tenders?.map((t: any) => {
                    const typeName = types.find(type => type.id === t.tenderTypeId)?.name || t.name || 'Unknown';
                    return { type: typeName, amount: t.amount }
                }),
                change: data.tenderChange,
                totalTendered: data.tenders?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
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
