import { HoldItem } from './HoldItem';

export interface HoldCriteria {
  controlNumber?: string;
  caseNumber?: string;
  inventoryNumber?: string;
  jurisdiction?: string;
  agency?: string;
}

export interface HoldRepository {
  findList(criteria: HoldCriteria): Promise<HoldItem[]>;
}
