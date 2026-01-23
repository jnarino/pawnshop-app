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
};
