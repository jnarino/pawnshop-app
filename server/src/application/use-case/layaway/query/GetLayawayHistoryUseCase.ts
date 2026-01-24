import { LayawayRepository } from '../../../../domains/layaway/LayawayRepository';
import { GetLayawayHistoryRequestDto, getLayawayHistoryRequestSchema } from '../../../dto/layaway/query/GetLayawayHistoryRequestDto';
import { LayawayHistoryResponseDto } from '../../../dto/layaway/query/LayawayHistoryResponseDto';

export class GetLayawayHistoryUseCase {
  constructor(private readonly layawayRepo: LayawayRepository) {}

  async execute(input: unknown): Promise<LayawayHistoryResponseDto> {
    const { customerId, ticketnum } = getLayawayHistoryRequestSchema.parse(input);

    const history = await this.layawayRepo.getHistory(customerId, ticketnum);

    return history.map(item => ({
      occurredAt: item.occurredAt.toISOString(),
      transactionType: item.transactionType,
      clerkUsername: item.clerkUsername,
      amount: item.amount
    }));
  }
}
