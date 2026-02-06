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

    return holds.map(hold => ({
      id: hold.id,
      controlNumber: hold.controlNumber,
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
      clerkUsername: hold.clerkUsername,
      updateBy: hold.updatedBy,
      items: hold.items.map(item => ({
        id: item.id,
        inventorySubcategory: item.inventorySubcategory,
        inventoryCategory: item.inventoryCategory,
        status: item.status,
        quantity: item.quantity,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        colorId: item.colorId,
        itemCondition: item.itemCondition,
        ownerMark: item.ownerMark,
        itemDescription: item.itemDescription,
        priceAmount: item.priceAmount,
        inventoryNumber: item.inventoryNumber
      }))
    }));
  }
}
