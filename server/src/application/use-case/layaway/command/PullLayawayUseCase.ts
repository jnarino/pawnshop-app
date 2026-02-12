import { LayawayUnitOfWork } from '../../../common/LayawayUnitOfWork';
import { PullLayawayRequestDto, pullLayawayRequestSchema } from '../../../dto/layaway/command/PullLayawayRequestDto';
import { NotFoundError } from '../../../common/errors';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';

export class PullLayawayUseCase {
    constructor(private readonly uow: LayawayUnitOfWork) { }

    async execute(input: unknown, userId: string): Promise<{ message: string }> {
        const dto = pullLayawayRequestSchema.parse(input);

        return await this.uow.runInTransaction(async (repos) => {
            const { layawayRepository, inventoryItemRepository } = repos;

            const layaways = await layawayRepository.findByTicketNum(dto.ticketnum);

            // Filter by customerId
            const customerLayaways = layaways.filter(l => l.customerId === dto.customerId);

            if (!customerLayaways.length) {
                // If ticket found but not for this customer
                if (layaways.length > 0) {
                    throw new NotFoundError(`Layaway ticket ${dto.ticketnum} does not belong to customer ${dto.customerId}`);
                }
                throw new NotFoundError(`Layaway ticket ${dto.ticketnum} not found`);
            }

            const statusEquals = (status: string | null | undefined, target: string) =>
                (status ?? '').toLowerCase() === target.toLowerCase();

            // Check if already in final state (case-insensitive to handle legacy data)
            if (customerLayaways.some(l => statusEquals(l.status, 'Defaulted'))) {
                throw new Error(`Layaway ticket ${dto.ticketnum} is already defaulted`);
            }
            if (customerLayaways.some(l => statusEquals(l.status, 'Voided'))) {
                throw new Error(`Layaway ticket ${dto.ticketnum} is voided`);
            }
            if (customerLayaways.some(l => statusEquals(l.status, 'Sold'))) {
                throw new Error(`Layaway ticket ${dto.ticketnum} is sold`);
            }

            const activeItems = customerLayaways.filter(l => statusEquals(l.status, 'Active'));
            if (!activeItems.length) {
                throw new Error(`No active items found for layaway ticket ${dto.ticketnum}`);
            }

            for (const layaway of activeItems) {
                const updated = new LayawayAgreement({
                    ...layaway,
                    status: 'defaulted',
                    itemStatus: 'D',
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
