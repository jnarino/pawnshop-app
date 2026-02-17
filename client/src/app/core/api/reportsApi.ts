import { CashDrawerDetailWithSummaryResponseDto } from '../dto/CashDrawerReportDto';
import { http } from './http';


export interface CreatePoliceReportPayload {
  from: string;
  to: string;
}

export const reportsApi = {

  policeReport: async (payload: CreatePoliceReportPayload): Promise<Blob | null> => {
    return http(`/api/reports/police/daily?startDate=${payload.from}&endDate=${payload.to}`, {
      method: 'GET',
      responseType: 'blob',
    });
  },

  dailyReport: async (payload: CreatePoliceReportPayload): Promise<Blob | null> => {
    // Mock PDF for testing
    const mockPdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICAlIHBhZ2UKPDwKICAvVHlwZSAvUGFnZQogIC9QYXJlbnQgMiAwIFIKICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8PAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqICAlIGZvbnQKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudA0KPDwKICAvTGVuZ3RoIDQ5Cj4+CnN0cmVhbQpCVAo3MCA3MDAgVGQKL0YxIDI0IFRmCihEYWlseSBSZXBvcnQgLSBUZXN0IChNb2NrKSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNTIgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDcKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDU0CiUlRU9GCo==";

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const byteCharacters = atob(mockPdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });

    /* return http('/api/reports/daily', {
      method: 'POST',
      body: JSON.stringify(payload),
      responseType: 'blob',
    }); */
  },

  forfeitReport: async (payload: CreatePoliceReportPayload): Promise<any> => {
    try {
      const response = (await http(`/api/pawn-ticket/date-range?from=${payload.from}&to=${payload.to}`)) as {
        transactionType: string;
        controlNumber: string;
        transactionDate: string;
        defaultDate: string;
        amountFinanced?: number;
        purchaseTradeValue?: number;
        customer?: { firstName: string; lastName: string };
        items: { itemDescription: string; priceAmount: number }[];
      }[];

      const buys: any[] = [];
      const pawns: any[] = [];
      let buysCosts = 0;
      let pawnsCosts = 0;

      response.forEach(t => {
        const itemCostTotal = t.transactionType === 'PAWN'
          ? (t.amountFinanced || 0)
          : (t.purchaseTradeValue || 0);

        const forfeitItem = {
          controlNumber: t.controlNumber,
          dateIn: t.transactionDate,
          dateOut: t.defaultDate,
          customer: t.customer ? `${t.customer.firstName} ${t.customer.lastName}` : '',
          phone: '', // Not available in API response yet
          redemptionRatio: '',
          emp: '',
          lastPaid: '',
          note: '',
          cost: itemCostTotal,
          items: t.items.map(i => ({
            itemDescription: i.itemDescription || '',
            cost: i.priceAmount || 0
          }))
        };

        if (t.transactionType === 'PURCHASE') {
          buys.push(forfeitItem);
          buysCosts += itemCostTotal;
        } else if (t.transactionType === 'PAWN') {
          pawns.push(forfeitItem);
          pawnsCosts += itemCostTotal;
        }
      });

      return {
        buys,
        pawns,
        buysCosts,
        pawnsCosts,
        total: buysCosts + pawnsCosts
      };
    } catch (error) {
      console.error("Failed to fetch forfeit report data", error);
      throw error;
    }
  },
  cashDrawerDetailReport: async (payload: CreatePoliceReportPayload): Promise<CashDrawerDetailWithSummaryResponseDto> => {
    return http(`/api/reports/cash-drawer/detail?startDate=${payload.from}&endDate=${payload.to}`, {
      method: 'GET',
    });
  },

  taxSalesReport: async (payload: CreatePoliceReportPayload & { onlyTotals: boolean }): Promise<TaxSalesReportData> => {
    return http(`/api/reports/taxes/sales?startDate=${payload.from}&endDate=${payload.to}&onlyTotals=${payload.onlyTotals}`, {
      method: 'GET',
    });
  },

  firearmsCountReport: async (): Promise<FirearmsCountReportData> => {
    // Mock data
    const mockItem = (prefix: string, i: number): FirearmsItem => ({
      inventoryNum: `${prefix}-${1000 + i}`,
      type: "PISTOL",
      serial: `SN${9000 + i}`,
      brand: "GLOCK",
      ticketNumber: `${20000 + i}`,
      model: "19 GEN 5",
      customer: "John Doe",
      caliber: "9MM",
      Action: "SEMI-AUTO"
    });

    const generateItems = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => mockItem(prefix, i));

    const response: FirearmsCountReportData = {
      buy: generateItems("B", 3),
      holdPeriod: generateItems("HP", 2),
      inventory: generateItems("INV", 5),
      layaway: generateItems("LAY", 1),
      pawn: generateItems("P", 4),
      policeHold: generateItems("PH", 2),
      totals: {
        buy: 3,
        holdPeriod: 2,
        inventory: 5,
        layaway: 1,
        pawn: 4,
        policeHold: 2,
        total: 17
      }
    };

    return new Promise(resolve => setTimeout(() => resolve(response), 500));


    /* 
    // Uncomment when the endpoint is ready and delete mock data above
    return http(`/api/reports/firearms-count`, {
      method: 'GET',
    }); 
    */
  },

  pawnActiveReport: async (params: {
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    exclude?: boolean;
  }): Promise<ItemsInPawnsReportData> => {
    const query = new URLSearchParams();
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.subcategoryId) query.append('subcategoryId', params.subcategoryId);
    if (params.brandId) query.append('brandId', params.brandId);
    if (params.exclude !== undefined) query.append('excludeJewelryAndFirearm', String(params.exclude));

    return http(`/api/reports/pawn/active?${query.toString()}`, {
      method: 'GET',
    });
  },

  inventoryActiveReport: async (params: {
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    exclude?: boolean;
  }): Promise<InventoryReportData> => {
    const query = new URLSearchParams();
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.subcategoryId) query.append('subcategoryId', params.subcategoryId);
    if (params.brandId) query.append('brandId', params.brandId);
    if (params.exclude !== undefined) query.append('excludeJewelryAndFirearm', String(params.exclude));

    return http(`/api/reports/inventory/items?${query.toString()}`, {
      method: 'GET',
    });
  },
};

export interface ItemsInPawnsReportData {
  rows: {
    pawnTicketId: string;
    ticketNumber: string;
    customer: string;
    employee: string;
    dateIn: string;
    dateOut: string;
    serviceChargeDue: number;
    currentCharges: number;
    pawnAmount: number;
    itemAmount: number;
    quantity: number;
    itemDescription: string;
    status: string;
    itemsCount: number;
    items: {
      description: string;
      amount: number;
      quantity: number;
      brand: string;
      model: string;
      serialNumber: string;
      extra?: Record<string, any>;
      attributes?: Record<string, any>;
    }[];
  }[];
  totals: {
    totalPawns: number;
    totalItems: number;
    totalPawnAmount: number;
    totalServiceChargesDue: number;
    totalPoliceHoldAmount: number;
  };
}

export interface InventoryReportData {
  rows: {
    inventoryNumber: string;
    itemType: string;
    type: string;
    brand: string;
    itemDescription: string;
    model: string;
    serialNumber: string;
    quantity: number;
    cost: number;
    resale: number;
  }[];
  totals: {
    totalItems: number;
    totalQuantity: number;
    totalCost: number;
    totalResale: number;
  };
}

export interface FirearmsItem {
  inventoryNum: string;
  type: string;
  serial: string;
  brand: string;
  ticketNumber: string;
  model: string;
  customer: string;
  caliber: string;
  Action: string;
}

export interface FirearmsCountReportData {
  buy: FirearmsItem[];
  holdPeriod: FirearmsItem[];
  inventory: FirearmsItem[];
  layaway: FirearmsItem[];
  pawn: FirearmsItem[];
  policeHold: FirearmsItem[];
  totals: {
    buy: number;
    holdPeriod: number;
    inventory: number;
    layaway: number;
    pawn: number;
    policeHold: number;
    total: number;
  };
}

export interface TaxSalesReportData {
  // ... existing TaxSalesReportData logic ...
  rows: {
    date: string;
    type: string;
    ticketNumber: string;
    grossAmount: number;
    taxableAmount: number;
    taxCollected: number;
  }[];
  totals: {
    stateTax: {
      collected: number;
      taxRate: number;
    };
    countyTax: {
      collected: number;
      taxRate: number | null;
    };
    localTax: {
      collected: number;
      taxRate: number | null;
    };
    grossSales: number;
    exemptSales: number;
    taxableSales: number;
    stateTaxCalculated: number;
    countyTaxCalculated: number;
    localTaxCalculated: number;
    collectionAllowances: {
      stateTax: number;
      countyTax: number;
      localTax: number;
    };
    amountDueWithReturn: number;
  };
}