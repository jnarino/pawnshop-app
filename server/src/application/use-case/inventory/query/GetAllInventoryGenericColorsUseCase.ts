import { InventoryColorRepository } from '../../../../domains/inventory/InventoryColorRepository';
import { InventoryGenericColorResponseDto } from '../../../dto/inventory/query/InventoryColorResponseDto';
import { toInventoryColorResponseDto } from '../../../mapping/inventory/inventoryColorMapper';

export class GetAllInventoryGenericColorsUseCase {
  constructor(private readonly inventoryColorRepo: InventoryColorRepository) { }

  async execute(): Promise<InventoryGenericColorResponseDto[]> {
    const colors = await this.inventoryColorRepo.findAllGenericColors();
    return colors.map(toInventoryColorResponseDto);
  }
}
