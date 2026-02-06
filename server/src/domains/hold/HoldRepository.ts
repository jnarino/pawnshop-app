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
  findById(id: string): Promise<HoldItem | null>;
  create(hold: HoldItem, inventoryItemIds: string[]): Promise<HoldItem>;
  update(hold: HoldItem, inventoryItemIds: string[]): Promise<HoldItem | null>;
}
