import { LayawayAgreement } from './LayawayAgreement';

export interface FindLayawaysCriteria {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface LayawayRepository {
  findByCriteria(criteria: FindLayawaysCriteria): Promise<LayawayAgreement[]>;
}
