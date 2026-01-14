import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { NotFoundError } from '../../../common/errors';
import { CustomerStatisticsResponseDto } from '../../../dto/customer/query/CustomerStatisticsResponseDto';
import {
  GetCustomerStatisticsRequestDto,
  getCustomerStatisticsRequestSchema
} from '../../../dto/customer/query/GetCustomerStatisticsRequestDto';

export class GetCustomerStatisticsUseCase {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: unknown): Promise<CustomerStatisticsResponseDto> {
    // 1. Validate input
    const { id }: GetCustomerStatisticsRequestDto =
      getCustomerStatisticsRequestSchema.parse(input);

    // 2. Get statistics from repository
    const stats = await this.customerRepo.getStatistics(id);
    
    if (!stats) {
      throw new NotFoundError('Customer not found');
    }

    // 3. Calculate redemption and default ratios
    const redemptionRatio = stats.totalPawns > 0
      ? (stats.redeemedPawns / stats.totalPawns) * 100
      : 0;

    const defaultRatio = stats.totalPawns > 0
      ? (stats.defaultedPawns / stats.totalPawns) * 100
      : 0;

    // 4. Return DTO with calculated percentages
    return {
      customerId: stats.customerId,
      customerName: stats.customerName,
      activePawns: stats.activePawns,
      redeemedPawns: stats.redeemedPawns,
      defaultedPawns: stats.defaultedPawns,
      buys: stats.buys,
      redemptionRatio: Math.round(redemptionRatio), // Round to whole percentage
      defaultRatio: Math.round(defaultRatio),       // Round to whole percentage
      totalSalesAmount: stats.totalSalesAmount
    };
  }
}
