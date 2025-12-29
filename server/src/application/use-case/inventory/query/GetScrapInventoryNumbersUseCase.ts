import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { ScrapInventoryNumberResponseDto } from '../../../dto/inventory/query/ScrapInventoryNumberResponseDto';
import { toScrapInventoryNumberResponseDto } from '../../../mapping/inventory/scrapInventoryNumberMapper';

export class GetScrapInventoryNumbersUseCase {
  constructor(private readonly inventoryItemRepository: InventoryItemRepository) {}

  async execute(): Promise<ScrapInventoryNumberResponseDto> {
    const items = await this.inventoryItemRepository.findByInventoryNumbers([]);

    return toScrapInventoryNumberResponseDto(items);
  }
}
