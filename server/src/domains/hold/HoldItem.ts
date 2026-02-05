export interface HoldInventoryItem {
  id: string;
  inventorySubcategory: { id: string; name: string };
  inventoryCategory: { id: string; name: string };
  status: string;
  quantity: number;
  brand: { id: string; name: string } | null;
  model: string;
  serialNumber: string;
  colorId: string | null;
  itemCondition: string;
  ownerMark: string;
  itemDescription: string;
  priceAmount: number | null;
  inventoryNumber: string;
}

export class HoldItem {
  readonly id: string;
  controlNumber: string;
  customerId: string;
  holdDate: Date;
  agency: string;
  caseNumber: string;
  dateOut: Date | null;
  isHold: boolean;
  isInventory: boolean;
  comment: string | null;
  agentLastName: string | null;
  agentFirstName: string | null;
  agentMiddleInitial: string | null;
  badgeNumber: string | null;
  phoneAreaCode: string | null;
  phoneNumber: string | null;
  phoneExtension: string | null;
  jurisdiction: string | null;
  legacyHcnId: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;

  items: HoldInventoryItem[];

  constructor(params: {
    id: string;
    controlNumber: string;
    customerId: string;
    holdDate: Date;
    agency: string;
    caseNumber: string;
    dateOut: Date | null;
    isHold: boolean;
    isInventory: boolean;
    comment: string | null;
    agentLastName: string | null;
    agentFirstName: string | null;
    agentMiddleInitial: string | null;
    badgeNumber: string | null;
    phoneAreaCode: string | null;
    phoneNumber: string | null;
    phoneExtension: string | null;
    jurisdiction: string | null;
    legacyHcnId: string | null;
    updatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: HoldInventoryItem[];
  }) {
    this.id = params.id;
    this.controlNumber = params.controlNumber;
    this.customerId = params.customerId;
    this.holdDate = params.holdDate;
    this.agency = params.agency;
    this.caseNumber = params.caseNumber;
    this.dateOut = params.dateOut;
    this.isHold = params.isHold;
    this.isInventory = params.isInventory;
    this.comment = params.comment;
    this.agentLastName = params.agentLastName;
    this.agentFirstName = params.agentFirstName;
    this.agentMiddleInitial = params.agentMiddleInitial;
    this.badgeNumber = params.badgeNumber;
    this.phoneAreaCode = params.phoneAreaCode;
    this.phoneNumber = params.phoneNumber;
    this.phoneExtension = params.phoneExtension;
    this.jurisdiction = params.jurisdiction;
    this.legacyHcnId = params.legacyHcnId;
    this.updatedBy = params.updatedBy;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;

    this.items = params.items || [];
  }
}
