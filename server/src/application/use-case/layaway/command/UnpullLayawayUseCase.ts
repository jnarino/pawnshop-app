import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { UnpullLayawayRequestDto, unpullLayawayRequestSchema } from '../../../dto/layaway/command/UnpullLayawayRequestDto';
import { NotFoundError } from '../../../common/errors';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';

export class UnpullLayawayUseCase {
  constructor(private readonly uow: LayawayUnitOfWork) {}

  async execute(input: unknown, userId: string): Promise<{ message: string }> {
    const dto = unpullLayawayRequestSchema.parse(input);

    return await this.uow.runInTransaction(async (repos) => {
      const { layawayRepository, inventoryItemRepository } = repos;

      const layaways = await layawayRepository.findByTicketNum(dto.ticketnum);
      if (!layaways.length) throw new NotFoundError(`Layaway ticket ${dto.ticketnum} not found`);

      // Must be Defaulted to Unpull
      // We look for any defaulted items in this ticket.
      const defaultedItems = layaways.filter(l => l.status === 'Defaulted');
      
      if (defaultedItems.length === 0) {
          // If no defaulted items, maybe it's completely paid or void?
          throw new Error(`Layaway ticket ${dto.ticketnum} has no defaulted items to unpull.`);
      }

      for (const layaway of defaultedItems) {
          if (!layaway.itemsId) continue;

          // Check availability
          const item = await inventoryItemRepository.findById(layaway.itemsId);
          if (!item) throw new NotFoundError(`Inventory item ${layaway.itemsId} not found`);

          if (item.status !== 'I') {
              throw new Error(`Inventory item ${item.inventoryNumber} is not available (Status: ${item.status}). It may have been sold.`);
          }

          // Restore Layaway
          const updated = new LayawayAgreement({
              ...layaway,
              status: 'Active',
              itemStatus: 'Active', 
              lastUpdatedAt: new Date(),
              lastUpdatedUserId: userId
          });
          await layawayRepository.update(updated);

          // Update Inventory: Status 'L', Quantity 0 (Hold)
          // "add logic implied by unpull": essentially put back on layaway (off hand)
          await inventoryItemRepository.updateStatusAndQuantity(layaway.itemsId, 'L', 0);
      }

      return { message: 'Layaway unpulled successfully' };
    });
  }
}
