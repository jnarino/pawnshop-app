export type PoliceHoldItemDto = {
  id: string;
  inventorySubcategory: { id: string; name: string };
  inventoryCategory: { id: string; name: string };
  status: string;
  quantity: number;
  brand: { id: string; name: string } | null;
  model: string | null;
  serialNumber: string | null;
  colorId: string | null;
  itemCondition: string;
  ownerMark: string;
  itemDescription: string | null;
  priceAmount: number | null;
  inventoryNumber: string | null;
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
  items: PoliceHoldItemDto[];
};
