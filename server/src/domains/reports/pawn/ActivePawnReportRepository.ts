import { ActivePawnRecord } from './ActivePawnRecord';

export type FindActivePawnsCriteria = {
  categoryId?: string;
  subcategoryId?: string;
  excludeJewelryAndFirearm?: boolean;
};

export interface ActivePawnReportRepository {
  findActive(criteria: FindActivePawnsCriteria): Promise<ActivePawnRecord[]>;
}
