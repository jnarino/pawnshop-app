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

};