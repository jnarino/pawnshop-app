import { useCallback, useState } from 'react';
import { TransactionFormPrinter } from '@/app/core/printing/TransactionFormPrinter';
import { LabelPrinter } from '@/app/core/printing/LabelPrinter';
import type { TransactionPrintData } from '@/app/core/printing/TransactionFormPrinter';
import type { LabelPrintData } from '@/app/core/printing/LabelPrinter';
import type { TicketByControlNumber } from '@/app/core/api/pawnTicketApi';
import type { Customer } from '@/app/feature/_shared/customer';

export interface PrintItem {
  id: string;
  inventoryNumber: string;
  description: string;
  amount: string;
  quantity?: number;
  category?: string;
  subcategory?: string;
  color?: string;
  model?: string;
  serialNumber?: string;
}

export interface FormDataItem {
  type: string;
  brand?: string;
  model?: string;
  serial?: string;
  description?: string;
  amount?: string;
  quantity?: string;
  subcategoryName?: string;
  colorName?: string;
  categoryName?: string;
  brandName?: string;
  ownerNumber?: string;
  id?: string;
  inventoryNumber?: string;
}

interface PrintFormParams {
  ticket: TicketByControlNumber;
  customer: Customer;
  items: FormDataItem[];
  financeCharge?: number;
  totalOfPayments?: number;
  annualRate?: number;
}

interface UsePawnPrintResult {
  printTransactionForm: (params: PrintFormParams) => Promise<boolean>;
  printLabels: (
    ticket: TicketByControlNumber,
    customer: Customer,
    items: PrintItem[],
    labelCounts: Record<string, number>
  ) => Promise<boolean>;
  buildPrintItems: (ticket: TicketByControlNumber, items: FormDataItem[]) => PrintItem[];
  isFormPrinting: boolean;
  isLabelsPrinting: boolean;
  formError: string | null;
  labelsError: string | null;
}

function formatDate(dateStr: string | number | Date): string {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(num) ? num.toFixed(2) : '';
}

export function usePawnPrint(): UsePawnPrintResult {
  const [isFormPrinting, setIsFormPrinting] = useState(false);
  const [isLabelsPrinting, setIsLabelsPrinting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [labelsError, setLabelsError] = useState<string | null>(null);

  const buildPrintItems = useCallback((
    ticket: TicketByControlNumber,
    items: FormDataItem[]
  ): PrintItem[] => {
    return items.map((item, index) => {
      const baseDescription = item.description || `${item.brandName || item.brand || ''} ${item.model || ''}`.trim() || 'Item';
      const fullDescription = item.colorName ? `${item.colorName} ${baseDescription}`.trim() : baseDescription;

      return {
        id: item.id || ticket.itemIds[index] || `item-${index}`,
        inventoryNumber: item.inventoryNumber || `${ticket.controlNumber}-${index + 1}`,
        description: fullDescription,
        amount: formatMoney(item.amount),
        quantity: item.quantity ? parseInt(item.quantity, 10) : 1,
        category: item.categoryName,
        subcategory: item.subcategoryName,
        color: item.colorName,
        model: item.model,
        serialNumber: item.serial,
      };
    });
  }, []);

  const printTransactionForm = useCallback(async (params: PrintFormParams): Promise<boolean> => {
    setIsFormPrinting(true);
    setFormError(null);

    try {
      const { ticket, customer, items } = params;

      const printData: TransactionPrintData = {
        transactionDate: ticket.transactionDate,
        maturityDate: ticket.maturityDate,
        defaultDate: ticket.defaultDate,
        controlNumber: ticket.controlNumber,
        ticketType: ticket.transactionType,

        customerLastName: customer.lastName,
        customerFirst: customer.firstName,
        customerMiddle: customer.middleName || undefined,
        customerBirthdate: customer.dateOfBirth ? formatDate(customer.dateOfBirth) : undefined,
        customerSex: customer.sex || undefined,
        customerRace: customer.race || undefined,

        customerAddress: customer.streetAddress || undefined,
        customerCity: customer.city || undefined,
        customerState: customer.stateUs || undefined,
        customerZip: customer.zipCode || undefined,
        customerPhone: customer.phoneNumber || undefined,

        customerEmployer: customer.employerName || undefined,

        customerIdNumber: customer.idNumber || undefined,
        customerIdType: customer.idType || undefined,
        customerIdState: customer.idState || undefined,

        customerHeight: customer.height || undefined,
        customerWeight: customer.weight || undefined,
        customerEyes: customer.eyeColor || undefined,
        customerHair: customer.hairColor || undefined,

        items: items.map((item) => {
          const baseDesc = item.description || '';
          const descWithColor = item.colorName ? `${item.colorName} ${baseDesc}`.trim() : baseDesc;

          // Helper for clean printing (prioritize name, avoid UUIDs)
          const clean = (preferred?: string, fallback?: string, defaultVal = 'NONE') => {
            const isUUID = (s?: string) => s && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(s);
            if (preferred && !isUUID(preferred)) return preferred;
            if (fallback && !isUUID(fallback)) return fallback;
            return defaultVal;
          };

          const cleanSerial = (s?: string) => (s && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(s) ? undefined : s);

          const ticketItem = ticket.items.find((i) => i.id === item.id);

          return {
            serialNumber: cleanSerial(item.serial) || undefined,
            ownerAppliedNumber: cleanSerial(item.ownerNumber) || undefined,
            brand: clean(item.brandName, item.brand, 'NONE'),
            modelNumber: clean(item.subcategoryName, item.model, 'NONE'),
            description: descWithColor,
            amount: item.amount,
            itemType: ticketItem?.inventorySubcategory.name || 'MISC',
          };
        }),

        amountFinanced: ticket.amountFinanced ?? undefined,
        financeCharge: ticket.amountFinanced && ticket.periodicRate ? (ticket.amountFinanced * ticket.periodicRate) : undefined,
        totalOfPayments: ticket.redemptionAmount ?? params.totalOfPayments ?? undefined,
        annualRate: ticket.apr ?? params.annualRate ?? undefined,
      };

      const printer = new TransactionFormPrinter();
      const printResult = await printer.print(printData);

      if (!printResult.success) {
        setFormError(printResult.error || 'Form print failed');
        return false;
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Form print failed';
      setFormError(message);
      return false;
    } finally {
      setIsFormPrinting(false);
    }
  }, []);

  const printLabels = useCallback(async (
    ticket: TicketByControlNumber,
    customer: Customer,
    items: PrintItem[],
    labelCounts: Record<string, number>
  ): Promise<boolean> => {
    setIsLabelsPrinting(true);
    setLabelsError(null);

    try {
      const labels: LabelPrintData[] = [];
      const customerName = `${customer.lastName.toUpperCase()}, ${customer.firstName.toUpperCase()}`;
      const transactionType = ticket.transactionType === 'PAWN' ? 'P' : 'B';
      const transactionDate = formatDate(ticket.transactionDate);

      for (const item of items) {
        const count = labelCounts[item.id] || 0;
        for (let i = 0; i < count; i++) {
          labels.push({
            controlNumber: ticket.controlNumber,
            customerName,
            transactionType,
            transactionDate,
            labelIndex: i + 1,
            totalLabels: count,
            category: item.category,
            subcategory: item.subcategory,
            description: item.description,
            model: item.model,
            serialNumber: item.serialNumber,
          });
        }
      }

      if (labels.length === 0) {
        return true;
      }

      const printer = new LabelPrinter();
      const printResult = await printer.printMultiple(labels);

      if (!printResult.success) {
        setLabelsError(printResult.error || 'Label print failed');
        return false;
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Label print failed';
      setLabelsError(message);
      return false;
    } finally {
      setIsLabelsPrinting(false);
    }
  }, []);

  return {
    printTransactionForm,
    printLabels,
    buildPrintItems,
    isFormPrinting,
    isLabelsPrinting,
    formError,
    labelsError,
  };
}
