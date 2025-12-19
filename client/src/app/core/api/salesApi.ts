import { http } from './http';
import { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';

export interface CreateSalePayload {
    sale: {
        customerId?: string;
    };
    items: any[]; // Using any to match the loose typing of the form for now, or refine based on InventoryItemDraft
}

export interface SaleResponse {
    id: string;
    ticketNumber: string;
    // Add other fields as needed
}

export const salesApi = {
    create: async (payload: CreateSalePayload): Promise<SaleResponse> => {
        return http('/api/sales', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
};
