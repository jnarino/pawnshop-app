import { InventoryItemRowResponseDto } from './InventoryItemRowResponseDto';
import { InventoryTotalsResponseDto } from './InventoryTotalsResponseDto';

export type InventoryReportResponseDto = {
  rows: InventoryItemRowResponseDto[];
  totals: InventoryTotalsResponseDto;
};
