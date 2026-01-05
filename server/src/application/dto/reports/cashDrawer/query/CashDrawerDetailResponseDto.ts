export type CashDrawerDetailResponseDto = {
  dateTime: string;
  ticketNumber: string | null;
  employee: string;
  transactionType: string;
  amount: number;
  tenderChange: number;
  remarks: string | null;
  paymentMethod: string | null;
  balance: number;
};
