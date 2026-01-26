import { http } from './http';

export interface CreateLayawayPayload {
    customerId: string;
    taxExemptUsed: boolean;
    items: {
        inventoryItemId?: string;
        inventoryNumber: string;
        description: string;
        quantity: number;
        price: number;
    }[];
    tenders: {
        tenderTypeId: string;
        amount: number;
    }[];
}

export interface LayawayResponse {
    id: string;
    ticketNumber: string;
}

export const layawayApi = {
    create: async (payload: CreateLayawayPayload): Promise<LayawayResponse> => {
        return http('/api/layaway', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    voidLayaway: async (id: string, payload: any): Promise<any> => {
        return http(`/api/layaway/void`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    makePayment: async (payload: any): Promise<any> => {
        return http(`/api/layaway/payment`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    findByControlNumber: async (controlNumber: string): Promise<any[]> => {
        return http(`/api/layaway/${controlNumber}`);
    },
    getByCustomer: async (customerId: string): Promise<any[]> => {
        return http(`/api/layaway/customer/${customerId}`);
    },
    getByDateRange: async (startDate: string, endDate: string, status?: string): Promise<any[]> => {
        return http(`/api/layaway?${status ? `status=${status}&` : ''}startDate=${startDate}&endDate=${endDate}`);
    },
    getPaymentHistory: async (controlNumber: string, customerId: string): Promise<any[]> => {
        return http(`/api/layaway/history/${customerId}/${controlNumber}`);
    }
};
