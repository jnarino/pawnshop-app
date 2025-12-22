import { http } from './http';

export interface TenderType {
    id: number;
    name: string;
    legacyCode: string | null;
    active: boolean;
}

export const tenderTypeApi = {
    list: async (): Promise<TenderType[]> => {
        return http('/api/tender-types');
    },
};
