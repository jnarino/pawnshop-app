import { HoldUnitOfWork } from '../../../common/HoldUnitOfWork';
import { CreatePoliceHoldRequestDto, createPoliceHoldRequestSchema } from '../../../dto/hold/command/CreatePoliceHoldRequestDto';
import { PoliceHoldResponseDto } from '../../../dto/hold/query/PoliceHoldResponseDto';
import { HoldItem } from '../../../../domains/hold/HoldItem';
import crypto from 'crypto';

export class CreatePoliceHoldUseCase {
  constructor(private readonly uow: HoldUnitOfWork) {}

  async execute(input: unknown): Promise<PoliceHoldResponseDto> {
    const dto: CreatePoliceHoldRequestDto = createPoliceHoldRequestSchema.parse(input);

    return await this.uow.runInTransaction(async (deps) => {
      // 1. Generate Control Number (Use Pawn sequence as default if no Police Hold sequence)
      const controlNumber = await deps.controlNumberRepository.getNextPawnControlNumber();

      // 2. Create Hold Entity
      const hold = new HoldItem({
        id: crypto.randomUUID(),
        controlNumber: controlNumber,
        holdDate: dto.holdDate ? new Date(dto.holdDate) : new Date(),
        agency: dto.agency,
        caseNumber: dto.caseNumber,
        dateOut: null,
        isHold: dto.isHold,
        isInventory: false,
        comment: dto.comment || null,
        agentLastName: dto.agentLastName || null,
        agentFirstName: dto.agentFirstName || null,
        agentMiddleInitial: dto.agentMiddleInitial || null,
        badgeNumber: dto.badgeNumber || null,
        phoneAreaCode: dto.phoneAreaCode || null,
        phoneNumber: dto.phoneNumber || null,
        phoneExtension: dto.phoneExtension || null,
        jurisdiction: dto.jurisdiction || null,
        legacyHcnId: null,
        clerkUsername: null,
        updatedBy: null, // Should come from context user if available
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 3. Persist Hold and Links
      await deps.holdRepository.create(hold, dto.itemIds);

      // 4. Update Inventory Status
      for (const itemId of dto.itemIds) {
        await deps.inventoryItemRepository.updateStatus(itemId, 'H');
      }

      // 5. Construct Response (Simplistic mapping since we just created it)
      // Note: Ideally we would fetch the full aggregate including items from DB to be sure
      // but to save a query we can construct it partially or just return the ID.
      // The requirement asks to create the endpoint. Just returning the mapped hold.
      
      return {
        id: hold.id,
        controlNumber: hold.controlNumber,
        holdDate: hold.holdDate.toISOString(),
        agency: hold.agency,
        caseNumber: hold.caseNumber,
        dateOut: hold.dateOut?.toISOString() || null,
        isHold: hold.isHold,
        isInventory: hold.isInventory,
        comment: hold.comment,
        agentLastName: hold.agentLastName,
        agentFirstName: hold.agentFirstName,
        agentMiddleInitial: hold.agentMiddleInitial,
        badgeNumber: hold.badgeNumber,
        phoneAreaCode: hold.phoneAreaCode,
        phoneNumber: hold.phoneNumber,
        phoneExtension: hold.phoneExtension,
        jurisdiction: hold.jurisdiction,
        legacyHcnId: hold.legacyHcnId,
        clerkUsername: hold.clerkUsername,
        updateBy: hold.updatedBy,
        items: [] // Returned empty as we didn't fetch them enriched. Frontend might need to refetch list.
      };
    });
  }
}
