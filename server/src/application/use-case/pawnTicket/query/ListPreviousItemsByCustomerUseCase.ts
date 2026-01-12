import { z } from 'zod';
import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import { InventoryItemResponseDto } from '../../../dto/inventory/InventoryItemResponseDto';
import { toInventoryItemResponseDto } from '../../../mapping/inventory/inventoryItemMappers';

export const listPreviousItemsByCustomerRequestSchema = z.object({
  customerId: z.string().uuid()
});

export type ListPreviousItemsByCustomerRequestDto = z.infer<typeof listPreviousItemsByCustomerRequestSchema>;

export class ListPreviousItemsByCustomerUseCase {
  constructor(private readonly pawnTicketRepo: PawnTicketRepository) {}

  async execute(input: unknown): Promise<InventoryItemResponseDto[]> {
    const { customerId }: ListPreviousItemsByCustomerRequestDto = listPreviousItemsByCustomerRequestSchema.parse(input);

    const items = await this.pawnTicketRepo.listPreviousItemsByCustomer(customerId);
    return items.map(toInventoryItemResponseDto);
  }
}
