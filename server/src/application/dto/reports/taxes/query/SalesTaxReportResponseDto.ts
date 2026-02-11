import { SalesTaxRowResponseDto } from './SalesTaxRowResponseDto';
import { SalesTaxTotalsResponseDto } from './SalesTaxTotalsResponseDto';

export type SalesTaxReportResponseDto = {
  rows: SalesTaxRowResponseDto[];
  totals: SalesTaxTotalsResponseDto;
};
