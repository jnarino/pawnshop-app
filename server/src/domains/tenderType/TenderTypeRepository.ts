import { TenderType } from './TenderType';

export interface TenderTypeRepository {
    findAllActive(): Promise<TenderType[]>;
}
