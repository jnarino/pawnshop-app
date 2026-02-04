export type PoliceHoldItemDto = {
  inventoryItemId: string;
  inventoryNumber: string | null;
  model: string | null;
  serialNumber: string | null;
  itemDescription: string | null;
};

export type PoliceHoldResponseDto = {
  id: string;
  controlNumber: string;
  customerId: string;
  holdDate: string; // ISO
  agency: string;
  caseNumber: string;
  dateOut: string | null; // ISO
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
  customerName: string | null;
  items: PoliceHoldItemDto[];
};
