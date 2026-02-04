import { HoldRepository } from '../../../../domains/hold/HoldRepository';
import { 
  ListPoliceHoldRequestDto, 
  listPoliceHoldRequestSchema 
} from '../../../dto/hold/query/ListPoliceHoldRequestDto';
import { PoliceHoldResponseDto } from '../../../dto/hold/query/PoliceHoldResponseDto';


export class ListPoliceHoldUseCase {
  constructor(private readonly holdRepository: HoldRepository) {}

  async execute(input: unknown): Promise<PoliceHoldResponseDto[]> {
    const criteria = listPoliceHoldRequestSchema.parse(input);

    const holds = await this.holdRepository.findList(criteria);

    const holdsMap = new Map<string, PoliceHoldResponseDto>();

    for (const hold of holds) {
      if (!holdsMap.has(hold.id)) {
        holdsMap.set(hold.id, {
          id: hold.id,
          controlNumber: hold.controlNumber,
          customerId: hold.customerId,
          holdDate: hold.holdDate ? new Date(hold.holdDate).toISOString() : '',
          agency: hold.agency,
          caseNumber: hold.caseNumber,
          dateOut: hold.dateOut ? hold.dateOut.toISOString() : null,
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
          updatedBy: hold.updatedBy,
          customerName: hold.customerFirstName && hold.customerLastName 
            ? `${hold.customerFirstName} ${hold.customerLastName}`.trim()
            : null,
          items: []
        });
      }

      if (hold.inventoryItemId) {
        holdsMap.get(hold.id)!.items.push({
          inventoryItemId: hold.inventoryItemId,
          inventoryNumber: hold.inventoryNumber || null,
          model: hold.model || null,
          serialNumber: hold.serialNumber || null,
          itemDescription: hold.itemDescription || null
        });
      }
    }

    return Array.from(holdsMap.values());
  }
}
