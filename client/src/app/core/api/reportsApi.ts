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

};