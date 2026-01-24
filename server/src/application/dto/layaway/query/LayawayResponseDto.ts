export type LayawayItemDto = {
  inventoryNumber: string | null;
  numberSold: number | null;
  itemAmount: number | null;
  description: string | null;
  taxExempt: boolean | null;
  returnSold: boolean | null;
  itemStatus: string | null;
  countyTaxExempt: boolean | null;
  itemLastUpdatedUserId: string | null;
  itemsId: string | null;
};

export type LayawayResponseDto = {
  id: string;
  controlNumber: string | null;
  clerkUserId: string | null;
  occurredAt: string | null;
  lastUpdatedAt: string | null;
  amount: number | null;
  taxSales: number | null;
  stateTax: number | null;
  returnedAmt: number | null;
  customer: {
    id: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    cellPhone: string | null;
    email: string | null;
  };
  note: string | null;
  status: string | null;
  defaultDate: string | null;
  totalOfPayments: number | null;
  period: number | null;
  extraNote: string | null;
  gunProcFee: number | null;
  lastUpdatedUserId: string | null;
  items: LayawayItemDto[];
  createdAt: string;
  updatedAt: string;
};
