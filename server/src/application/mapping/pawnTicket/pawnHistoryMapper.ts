import { PawnHistoryResponseDto } from '../../dto/pawnTicket/query/ListHistoryPawnsByCustomerDto';

export function toPawnHistoryResponseDto(row: any): PawnHistoryResponseDto {
  return {
    id: row.id,
    controlNumber: row.control_number,
    dateIn: row.date_in instanceof Date ? row.date_in.toISOString() : row.date_in,
    dateOut: row.date_out ? (row.date_out instanceof Date ? row.date_out.toISOString() : row.date_out) : null,
    status: row.status || '',
    clerkUsername: row.clerk_username || '',
    amount: parseFloat(row.amount),
    amountPaid: parseFloat(row.amount_paid),
    items: Array.isArray(row.items) ? row.items.filter((item: any) => item.id && item.description) : []
  };
}
