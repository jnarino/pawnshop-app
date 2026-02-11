import { SalesTaxRecord } from '../../../../domains/reports/taxes/SalesTaxRecord';
import { SalesTaxRowResponseDto } from '../../../dto/reports/taxes/query/SalesTaxRowResponseDto';

export function toSalesTaxRowDto(record: SalesTaxRecord): SalesTaxRowResponseDto {
  return {
    date: formatDate(record.occurredAt),
    type: record.type,
    ticketNumber: record.ticketNumber,
    grossAmount: record.grossAmount,
    taxableAmount: record.taxableAmount,
    taxCollected: record.taxCollected,
  };
}

function formatDate(date: Date): string {
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const year = date.getUTCFullYear().toString().padStart(4, '0');
  return `${month}/${day}/${year}`;
}
