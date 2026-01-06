import { CashDrawerRecord } from '../../../../domains/reports/cashDrawer/CashDrawerRecord';
import { CashDrawerDetailResponseDto } from '../../../dto/reports/cashDrawer/query/CashDrawerDetailResponseDto';

export function toCashDrawerDetailDto(record: CashDrawerRecord): CashDrawerDetailResponseDto {
  return {
    dateTime: record.occurredAt.toISOString(),
    ticketNumber: record.ticketNumber,
    employee: record.employee,
    transactionType: record.transactionType,
    amount: record.amount,
    tenderChange: record.tenderChange,
    remarks: record.remarks,
    paymentMethod: record.paymentMethod,
    balance: record.balance,
  };
}
