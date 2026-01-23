import { LayawayAgreement } from './LayawayAgreement';

export interface FindLayawaysCriteria {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
}

export interface LayawayRepository {
  findByCriteria(criteria: FindLayawaysCriteria): Promise<LayawayAgreement[]>;
  create(layaway: LayawayAgreement): Promise<LayawayAgreement>;
  findByTicketNum(ticketnum: string): Promise<LayawayAgreement[]>;
  update(layaway: LayawayAgreement): Promise<LayawayAgreement>;
}
