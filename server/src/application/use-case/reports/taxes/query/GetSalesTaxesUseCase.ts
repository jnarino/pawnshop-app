import { NotFoundError } from '../../../../common/errors';
import { GetSalesTaxesRequestDto, getSalesTaxesRequestSchema } from '../../../../dto/reports/taxes/query/GetSalesTaxesRequestDto';
import { SalesTaxReportResponseDto } from '../../../../dto/reports/taxes/query/SalesTaxReportResponseDto';
import { toSalesTaxRowDto } from '../../../../mapping/reports/taxes/salesTaxMapper';
import { SalesTaxTotalsService } from '../../../../service/reports/taxes/SalesTaxTotalsService';
import { SalesTaxReportRepository } from '../../../../../domains/reports/taxes/SalesTaxReportRepository';

export class GetSalesTaxesUseCase {
  constructor(
    private readonly repo: SalesTaxReportRepository,
    private readonly totalsService: SalesTaxTotalsService,
  ) { }

  async execute(input: unknown): Promise<SalesTaxReportResponseDto> {
    const dto: GetSalesTaxesRequestDto = getSalesTaxesRequestSchema.parse(input);
    const { start, end } = this.resolveDateRange(dto.startDate, dto.endDate);

    const records = await this.repo.findByDateRange(start, end);
    if (!records.length) {
      throw new NotFoundError('No sales tax records for the selected date range');
    }

    const totals = this.totalsService.calculate(records);
    const rows = dto.onlyTotals ? [] : records.map(toSalesTaxRowDto);

    return {
      rows,
      totals,
    };
  }

  private resolveDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : this.startOfDayUTC(new Date());
      const end = endDate ? new Date(endDate) : this.endOfDayUTC(new Date(start));
      return { start: this.startOfDayUTC(start), end: this.endOfDayUTC(end) };
    }

    const today = new Date();
    return { start: this.startOfDayUTC(today), end: this.endOfDayUTC(today) };
  }

  private startOfDayUTC(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private endOfDayUTC(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }
}
