import { LayawayRepository } from '../../../../domains/layaway/LayawayRepository';
import { getLayawaysRequestSchema, GetLayawaysRequestDto } from '../../../dto/layaway/query/GetLayawaysRequestDto';
import { LayawayResponseDto } from '../../../dto/layaway/query/LayawayResponseDto';
import { toLayawayResponseDto } from '../../../mapping/layaway/layawayMapper';

export class GetLayawaysUseCase {
  constructor(private readonly layawayRepo: LayawayRepository) {}

  async execute(input: unknown): Promise<LayawayResponseDto[]> {
    const criteria: GetLayawaysRequestDto = getLayawaysRequestSchema.parse(input);

    const layaways = await this.layawayRepo.findByCriteria(criteria);

    return layaways.map(toLayawayResponseDto);
  }
}
