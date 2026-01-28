import { useCallback, useState } from 'react';
import { TransactionFormPrinter } from '@/app/core/printing/TransactionFormPrinter';
import { LabelPrinter } from '@/app/core/printing/LabelPrinter';
import type { TransactionPrintData } from '@/app/core/printing/TransactionFormPrinter';
import type { LabelPrintData } from '@/app/core/printing/LabelPrinter';
import type { TicketByControlNumber } from '@/app/core/api/pawnTicketApi';
import type { Customer } from '@/app/feature/_shared/customer';
import { useAuth } from '@/app/core/hooks/useAuth';

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
  // Jewelry
  jewelryType?: string;
  metal?: string;
  karat?: string;
  gender?: string;
  style?: string;
  sizeLength?: string;
  weight?: string;
  weightUnit?: string;
  stone1Quantity?: string;
  stone1Shape?: string;
  stone1Carat?: string;
  stone1Weight?: string;
  stone1Color?: string;
  stone2Quantity?: string;
  stone2Shape?: string;
  stone2Carat?: string;
  stone2Weight?: string;
  stone2Color?: string;

  // Firearm
  caliber?: string;
  action?: string;
  importer?: string;
  barrel?: string;
  finish?: string;
  firearmType?: string;
  barrelLength?: string;
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
  transformToPrintInformation: (ticket: TicketByControlNumber, formData: any, customer: any) => any;
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
  const { user } = useAuth();

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

  const getFirearmTypeCode = (typeName: string) => {
    const TYPE_MAP = {
      'PISTOL': 'H',
      'RIFLE': 'R',
      'SHOTGUN': 'S',
      'AIRGUN': 'A',
      'BLACK POWDER': 'B',
    }
    return TYPE_MAP[typeName.toUpperCase()] ?? 'X';
  }

  const getBarrelCode = (barrelName: string) => {
    const BARREL_MAP = {
      'SINGLE BARREL': '1',
      'DOUBLE BARREL': '2',
      'OVER AND UNDER': '3',
    }
    return BARREL_MAP[barrelName.toUpperCase()] ?? '4';
  }

  const getActionCode = (actionName: string) => {
    const ACTION_MAP = {
      'REVOLVER': 'R',
      'SEMI-AUTOMATIC': 'A',
      'BOLT ACTION': 'B',
      'LEVER': 'L',
      'PUMP': 'P',
      'SINGLE SHOT': 'S',
      'SINGLE-SHOT': 'S',
    }
    return ACTION_MAP[actionName.toUpperCase()] ?? 'X';
  }

  const getFinishCode = (finishName: string) => {
    const FINISH_MAP = {
      'CHROME NICKEL': 'C',
      'BLUE STEEL': 'B',
      'STAINLESS STEEL': 'S',
    }
    return FINISH_MAP[finishName.toUpperCase()] ?? 'X';
  }

  const getJewelryTypeCode = (jewelryName: string) => {
    const JEWERLRY_TYPE_MAP = {
      'RING': 'R',
      'WATCH': 'W',
      'NECKLACE': 'N',
      'BRACELET': 'B',
      'PENDANT/CHARM': 'P',
      'PENDANT': 'P',
      'EARRINGS': 'E',
      'CHAIN': 'C',
      'CUFFLINKS': 'L',
    }
    return JEWERLRY_TYPE_MAP[jewelryName.toUpperCase()] ?? 'X';
  }

  const getMetalCode = (metalName: string) => {
    const METAL_MAP = {
      'YELLOW GOLD': 'Y',
      'WHITE GOLD': 'W',
      'STERLING SILVER': 'S',
      'PLATINUM': 'P',
      'TRI-COLOR': 'T',
    }
    return METAL_MAP[metalName.toUpperCase()] ?? 'X';
  }

  const getGenderCode = (genderName: string) => {
    const GENDER_MAP = {
      'MAN\'S': 'M',
      'WOMAN\'S': 'W',
      'NOT APPLICABLE': 'N',
    }
    return GENDER_MAP[genderName.toUpperCase()] ?? 'X';
  }

  const getStyleCode = (styleName: string) => {
    const STYLE_MAP = {
      'SERPENTINE': 'S',
      'HERRIGBONE': 'H',
      'ROPE': 'R',
      'BOX LINK': 'B',
      'FIGARO': 'F',
      'CAMEO': 'A',
      'CLASS / SCHOOL': 'C',
      'BAND': 'P',
      'SOLITAIRE': 'O',
      'NUGGET': 'N',
      'CLUSTER': 'D',
      'MONOGRAM': 'M',
    }
    return STYLE_MAP[styleName.toUpperCase()] ?? 'X';
  }

  const getStoneShapeCode = (stoneName: string) => {
    const STONE_MAP = {
      'OVAL': 'O',
      'ROUND': 'R',
      'PEAR': 'P',
      'EMERALD': 'E',
      'MARQUISE': 'M',
      'HEART': 'H',
    }
    return STONE_MAP[stoneName.toUpperCase()] ?? 'X';
  }

  const getStoneColorCode = (stoneColorName: string) => {
    const STONE_MAP = {
      'CLEAR': 'C',
      'GREEN': 'G',
      'AMBAR': 'A',
      'PURPLE': 'P',
      'BLUE': 'B',
      'RED': 'R',
      'PINK': 'R',
      'YELLOW': 'Y',
      'BLACK': 'K',
      'BROWN': 'O',
      'WHITE': 'W',
    }
    return STONE_MAP[stoneColorName.toUpperCase()] ?? 'X';
  }

  const transformToPrintInformation = (ticket: TicketByControlNumber, formData: any, customer: any): TransactionPrintData => {

    const items = formData.items.map((item: any) => ({
      type: item.type,
      brand: item.brandName,
      model: item.model,
      serial: item.serial,
      description: item.description,
      amount: item.amount,
      quantity: item.quantity,
      ownerNumber: item.ownerNumber,
      id: item.id,
      jewelryType: item.subcategoryName,
      metal: item.metal?.name,
      karat: item.karat?.name,
      weight: item.weight,
      weightUnit: item.weightUnit,
      gender: item.gender?.name,
      style: item.style?.name,
      color: item.color?.name,
      sizeLength: item.sizeLength?.name,
      stone1Quantity: (item.stones?.length || 0) > 0 ? item.stones?.[0].quantity : '',
      stone1Shape: (item.stones?.length || 0) > 0 ? item.stones?.[0].shape?.name : '',
      stone1Carat: (item.stones?.length || 0) > 0 ? item.stones?.[0].carat ? item.stones?.[0].carat : !!item.stones?.[0]?.quantity ? '0.00' : '' : '',
      stone1Weight: (item.stones?.length || 0) > 0 ? item.stones?.[0].weight ? item.stones?.[0].weight : !!item.stones?.[0]?.quantity ? '0.00' : '' : '',
      stone1Color: (item.stones?.length || 0) > 0 ? item.stones?.[0].color?.name : '',
      stone2Quantity: (item.stones?.length || 0) > 1 ? item.stones?.[1].quantity : '',
      stone2Shape: (item.stones?.length || 0) > 1 ? item.stones?.[1].shape?.name : '',
      stone2Carat: (item.stones?.length || 0) > 1 ? item.stones?.[1].carat ? item.stones?.[1].carat : !!item.stones?.[1]?.quantity ? '0.00' : '' : '',
      stone2Weight: (item.stones?.length || 0) > 1 ? item.stones?.[1].weight ? item.stones?.[1].weight : !!item.stones?.[1]?.quantity ? '0.00' : '' : '',
      stone2Color: (item.stones?.length || 0) > 1 ? item.stones?.[1].color?.name : '',

      // Firearm
      firearmType: item.subcategoryName,
      caliber: item.caliber?.name,
      action: item.action?.name,
      importer: item.importer?.name,
      finish: item.finish?.name,
      barrel: item.barrel?.name,
      barrelLength: item.barrelLength,
    }));

    return {
      transactionDate: ticket.createdDate,
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

      items: items.map((item: any) => {
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

        const isJewelry = !!item.style;
        const isFirearm = !!item.caliber;

        return {
          serialNumber: cleanSerial(item.serial) || undefined,
          ownerAppliedNumber: cleanSerial(item.ownerNumber) || undefined,
          brand: clean(item.brandName, item.brand, 'NONE'),
          modelNumber: clean(item.subcategoryName, item.model, 'NONE'),
          description: descWithColor,
          amount: item.amount,
          itemType: ticketItem?.inventorySubcategory.name || 'MISC',

          // Jewelry
          jewelryType: isJewelry ? getJewelryTypeCode(item.jewelryType || '') : '',
          jewelryMetal: isJewelry ? getMetalCode(item.metal || '') : '',
          jewelryKarat: isJewelry ? `${item.karat || ''} ${item.karat ? (item.weight || '') : ''} ${item.karat ? (item.weightUnit || '') : ''}` : '',
          jewelryGender: isJewelry ? getGenderCode(item.gender || '') : '',
          jewelryStyle: isJewelry ? getStyleCode(item.style || '') : '',
          jewelrySizeLength: isJewelry ? item.sizeLength : '',
          stone1Quantity: isJewelry ? item.stone1Quantity : '',
          stone1Shape: isJewelry ? getStoneShapeCode(item.stone1Shape || '') : '',
          stone1Carat: isJewelry ? item.stone1Carat : '',
          stone1Weight: isJewelry ? item.stone1Weight : '',
          stone1Color: isJewelry ? getStoneColorCode(item.stone1Color || '') : '',
          stone2Quantity: isJewelry ? item.stone2Quantity : '',
          stone2Shape: isJewelry ? getStoneShapeCode(item.stone2Shape || '') : '',
          stone2Carat: isJewelry ? item.stone2Carat : '',
          stone2Weight: isJewelry ? item.stone2Weight : '',
          stone2Color: isJewelry ? getStoneColorCode(item.stone2Color || '') : '',
          // Firearm
          firearmType: isFirearm ? getFirearmTypeCode(item.firearmType || '') : '',
          caliber: isFirearm ? item.caliber : '',
          action: isFirearm ? getActionCode(item.action || '') : '',
          importer: isFirearm ? item.importer : '',
          barrel: isFirearm ? getBarrelCode(item.barrel || '') : '',
          finish: isFirearm ? getFinishCode(item.finish || '') : '',
          barrelLength: isFirearm ? item.barrelLength : '',
        };
      }),

      employeeInitials: ticket.clerkUserName || user?.username || '',
      amountFinanced: ticket.amountFinanced ?? undefined,
      financeCharge: ticket.amountFinanced && ticket.periodicRate ? (ticket.amountFinanced * ticket.periodicRate) : undefined,
      totalOfPayments: ticket.redemptionAmount ?? undefined,
      annualRate: ticket.apr ?? undefined,
    }
  }

  const printTransactionForm = useCallback(async (printData: TransactionPrintData): Promise<boolean> => {
    setIsFormPrinting(true);
    setFormError(null);

    try {

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
    transformToPrintInformation,
    printLabels,
    buildPrintItems,
    isFormPrinting,
    isLabelsPrinting,
    formError,
    labelsError,
  };
}
