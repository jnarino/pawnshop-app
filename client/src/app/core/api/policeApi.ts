import { http } from './http';

export interface PoliceHoldItem {
    inventoryItemId: string;
    inventoryNumber: string;
    model: string;
    serialNumber: string;
    itemDescription: string;
    quantity: number;
    amount: number;
    priceAmount: number;
}

export interface PoliceHold {
    id: string;
    controlNumber: string;
    customerId: string;
    holdDate: string;
    agency: string;
    caseNumber: string;
    dateOut: string;
    isHold: boolean;
    isInventory: boolean;
    comment: string;
    agentLastName: string;
    agentFirstName: string;
    agentMiddleInitial: string;
    badgeNumber: string;
    phoneAreaCode: string;
    phoneNumber: string;
    phoneExtension: string;
    jurisdiction: string;
    legacyHcnId: string;
    updatedBy: string;
    items: PoliceHoldItem[];
}

export interface PoliceHoldSearchParams {
    controlNumber?: string;
    caseNumber?: string;
    inventoryNumber?: string;
    jurisdiction?: string;
    agency?: string;
}

export interface CreatePoliceHoldPayload {
    holdDate: string;
    agency: string;
    caseNumber: string;
    isHold: boolean;
    isInventory: boolean;
    comment: string;
    agentLastName: string;
    agentFirstName: string;
    agentMiddleInitial: string;
    badgeNumber: string;
    phoneAreaCode: string;
    phoneNumber: string;
    phoneExtension: string;
    jurisdiction: string;
    itemIds: string[];
}

export const policeApi = {
    getHolds: async (params: PoliceHoldSearchParams): Promise<PoliceHold[]> => {
        const queryParams = new URLSearchParams();
        if (params.controlNumber) queryParams.append('controlNumber', params.controlNumber);
        if (params.caseNumber) queryParams.append('caseNumber', params.caseNumber);
        if (params.inventoryNumber) queryParams.append('inventoryNumber', params.inventoryNumber);
        if (params.jurisdiction) queryParams.append('jurisdiction', params.jurisdiction);
        if (params.agency) queryParams.append('agency', params.agency);

        return http(`/api/police/holds?${queryParams.toString()}`);
    },

    createHold: async (payload: CreatePoliceHoldPayload): Promise<PoliceHold> => {
        return http('/api/police/holds', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    updateHold: async (id: string, payload: CreatePoliceHoldPayload): Promise<PoliceHold> => {
        return http(`/api/police/holds/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }
};
