import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { PullLayawayRequestDto, pullLayawayRequestSchema } from '../../../dto/layaway/command/PullLayawayRequestDto';
import { NotFoundError } from '../../../common/errors';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';

export class PullLayawayUseCase {
  constructor(private readonly uow: LayawayUnitOfWork) {}

  async execute(input: unknown, userId: string): Promise<{ message: string }> {
    const dto = pullLayawayRequestSchema.parse(input);

    return await this.uow.runInTransaction(async (repos) => {
      const { layawayRepository, inventoryItemRepository } = repos;

      const layaways = await layawayRepository.findByTicketNum(dto.ticketnum);
      if (!layaways.length) throw new NotFoundError(`Layaway ticket ${dto.ticketnum} not found`);

      // Check if already in final state
      if (layaways.some(l => l.status === 'Defaulted')) {
          throw new Error(`Layaway ticket ${dto.ticketnum} is already defaulted`);
      }
      if (layaways.some(l => l.status === 'Voided')) {
          throw new Error(`Layaway ticket ${dto.ticketnum} is voided`);
      }
      if (layaways.some(l => l.status === 'Sold')) {
          throw new Error(`Layaway ticket ${dto.ticketnum} is sold`);
      }

      const activeItems = layaways.filter(l => l.status === 'Active');
      if (!activeItems.length) {
          throw new Error(`No active items found for layaway ticket ${dto.ticketnum}`);
      }

      for (const layaway of activeItems) {
          const updated = new LayawayAgreement({
              ...layaway,
              status: 'Defaulted',
              itemStatus: 'Defaulted',
              lastUpdatedAt: new Date(),
              lastUpdatedUserId: userId
          });
          await layawayRepository.update(updated);

          if (layaway.itemsId) {
             // Return to inventory: Status 'I', Quantity 1 (Add on hand)
             await inventoryItemRepository.updateStatusAndQuantity(layaway.itemsId, 'I', 1);
          }
      }

      return { message: 'Layaway pulled successfully' };
    });
  }
}
