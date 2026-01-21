import { http } from './http';

export interface CreateSalePayload {
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

export interface SaleResponse {
    id: string;
    ticketNumber: string;
    // Add other fields as needed
}

export const salesApi = {
    create: async (payload: CreateSalePayload): Promise<SaleResponse> => {
        return http('/api/store-transaction', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    removeCashFromMainDrawer: async (payload: { amount: number; note: string; occurredAt: string }): Promise<any> => {
        return http('/api/store-transaction/remove-cash-from-main-drawer', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    addMoneyToMainDrawer: async (payload: {
        amount: number;
        transactionTenderName: string;
        isFromBank: boolean;
        note: string;
        occurredAt: string
    }): Promise<any> => {
        return http('/api/store-transaction/add-money-to-main-drawer', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    getDrawerBalance: async (): Promise<{
        lastCloseOccurredAt: string;
        lastCloseBalance: number;
        currentBalance: number;
        mainDrawerBalance: Record<string, number>;
        asOf: string;
    }> => {
        return http('/api/store-transaction/balance');
    },

    closeDrawerBalance: async (payload: {
        mainDrawerBalance: Record<string, number>;
        occurredAt: string;
        note: string;
    }): Promise<any> => {
        return http('/api/store-transaction/close-balance', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    },

    findByControlNumber: async (controlNumber: string): Promise<any[]> => {
        return http(`/api/store-transaction/by-control-number?controlNumber=${encodeURIComponent(controlNumber)}`);
    },

    getByCustomer: async (customerId: string): Promise<any[]> => {
        return http(`/api/store-transaction/by-customer/${customerId}`);
    },

    getByDateRange: async (startDate: string, endDate: string): Promise<any[]> => {
        return http(`/api/store-transaction/by-date?from=${startDate}&to=${endDate}`);
    },

    voidSale: async (id: string): Promise<SaleResponse> => {
        return http(`/api/store-transaction/void/${id}`, {
            method: 'PUT',
        });
    },
};
