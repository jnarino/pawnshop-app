import { z } from 'zod';
import { InventoryItemRepository } from '../../../../domains/inventory/InventoryItemRepository';
import { NotFoundError } from '../../../common/errors';


const deleteInventoryItemRequestSchema = z.object({
  id: z.string().min(1, 'id is required')
});

type DeleteInventoryItemRequestDto = z.infer<typeof deleteInventoryItemRequestSchema>;

export class DeleteInventoryItemUseCase {
  constructor(
    private readonly inventoryItemRepo: InventoryItemRepository
  ) {}

  async execute(input: unknown): Promise<void> {
    const dto: DeleteInventoryItemRequestDto =
      deleteInventoryItemRequestSchema.parse(input);

    const existing = await this.inventoryItemRepo.findById(dto.id);
    if (!existing) {
      throw new NotFoundError('Inventory item not found');
    }

    await this.inventoryItemRepo.delete(dto.id);
  }
}
