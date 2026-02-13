export type ActivePawnItemResponseDto = {
  description: string;
  amount: number;
  quantity: number;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  extra: Record<string, unknown>;
  attributes: Record<string, unknown>;
};

export type ActivePawnRowResponseDto = {
  pawnTicketId: string;
  ticketNumber: string;
  customer: string;
  employee: string;
  dateIn: string;
  dateOut: string;
  serviceChargeDue: number;
  currentCharges: number;
  pawnAmount: number;
  itemAmount: number;
  quantity: number;
  itemDescription: string;
  status: string;
  itemsCount: number;
  items: ActivePawnItemResponseDto[];
};
