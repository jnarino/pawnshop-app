import { HoldUnitOfWork } from '../../../common/HoldUnitOfWork';
import { UpdatePoliceHoldRequestDto, updatePoliceHoldRequestSchema } from '../../../dto/hold/command/UpdatePoliceHoldRequestDto';
import { PoliceHoldResponseDto } from '../../../dto/hold/query/PoliceHoldResponseDto';
import { HoldItem } from '../../../../domains/hold/HoldItem';
import { NotFoundError } from '../../../common/errors';

export class UpdatePoliceHoldUseCase {
  constructor(private readonly uow: HoldUnitOfWork) {}

  async execute(input: unknown): Promise<PoliceHoldResponseDto> {
    const dto: UpdatePoliceHoldRequestDto = updatePoliceHoldRequestSchema.parse(input);

    return await this.uow.runInTransaction(async (deps) => {
      const existing = await deps.holdRepository.findById(dto.id);
      if (!existing) {
        throw new NotFoundError('Police hold not found');
      }

      const hold = new HoldItem({
        id: existing.id,
        controlNumber: existing.controlNumber,
        holdDate: dto.holdDate ? new Date(dto.holdDate) : existing.holdDate,
        agency: dto.agency,
        caseNumber: dto.caseNumber,
        dateOut: existing.dateOut,
        isHold: dto.isHold,
        isInventory: existing.isInventory,
        comment: dto.comment ?? null,
        agentLastName: dto.agentLastName ?? null,
        agentFirstName: dto.agentFirstName ?? null,
        agentMiddleInitial: dto.agentMiddleInitial ?? null,
        badgeNumber: dto.badgeNumber ?? null,
        phoneAreaCode: dto.phoneAreaCode ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        phoneExtension: dto.phoneExtension ?? null,
        jurisdiction: dto.jurisdiction ?? null,
        legacyHcnId: existing.legacyHcnId,
        clerkUsername: existing.clerkUsername,
        updatedBy: existing.updatedBy,
        createdAt: existing.createdAt,
        updatedAt: new Date()
      });

      const updated = await deps.holdRepository.update(hold, dto.itemIds);
      if (!updated) {
        throw new NotFoundError('Police hold not found');
      }

      for (const itemId of dto.itemIds) {
        await deps.inventoryItemRepository.updateStatus(itemId, 'H');
      }

      return {
        id: updated.id,
        controlNumber: updated.controlNumber,
        holdDate: updated.holdDate.toISOString(),
        agency: updated.agency,
        caseNumber: updated.caseNumber,
        dateOut: updated.dateOut ? updated.dateOut.toISOString() : null,
        isHold: updated.isHold,
        isInventory: updated.isInventory,
        comment: updated.comment,
        agentLastName: updated.agentLastName,
        agentFirstName: updated.agentFirstName,
        agentMiddleInitial: updated.agentMiddleInitial,
        badgeNumber: updated.badgeNumber,
        phoneAreaCode: updated.phoneAreaCode,
        phoneNumber: updated.phoneNumber,
        phoneExtension: updated.phoneExtension,
        jurisdiction: updated.jurisdiction,
        legacyHcnId: updated.legacyHcnId,
        clerkUsername: updated.clerkUsername,
        updateBy: updated.updatedBy,
        items: []
      };
    });
  }
}
