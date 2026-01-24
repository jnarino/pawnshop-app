import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';
import { LayawayRepository } from '../../../../domains/layaway/LayawayRepository';
import { getLayawaysRequestSchema, GetLayawaysRequestDto } from '../../../dto/layaway/query/GetLayawaysRequestDto';
import { LayawayResponseDto } from '../../../dto/layaway/query/LayawayResponseDto';
import { toLayawayItemDto } from '../../../mapping/layaway/layawayMapper';

export class GetLayawaysUseCase {
  constructor(private readonly layawayRepo: LayawayRepository) {}

  async execute(input: unknown): Promise<LayawayResponseDto[]> {
    const criteria: GetLayawaysRequestDto = getLayawaysRequestSchema.parse(input);

    const flatLayaways = await this.layawayRepo.findByCriteria(criteria);

    // Grouping logic
    const groupedMap = new Map<string, LayawayResponseDto>();

    for (const layaway of flatLayaways) {
      const controlNumber = layaway.ticketnum;
      if (!controlNumber) continue; // Should not happen for valid tickets

      if (!groupedMap.has(controlNumber)) {
        // Initialize the group with header info from the first record
        groupedMap.set(controlNumber, {
          id: layaway.id,
          controlNumber: layaway.ticketnum,
          clerkUserId: layaway.clerkUserId,
          occurredAt: layaway.dateIn ? layaway.dateIn.toISOString() : null,
          lastUpdatedAt: layaway.lastUpdatedAt ? layaway.lastUpdatedAt.toISOString() : null,
          amount: layaway.amount,
          taxSales: layaway.taxSales,
          stateTax: layaway.stateTax,
          returnedAmt: layaway.returnedAmt,
          customer: {
            id: layaway.customerId,
            firstName: layaway.customerFirstName ?? null,
            middleName: layaway.customerMiddleName ?? null,
            lastName: layaway.customerLastName ?? null,
            dateOfBirth: layaway.customerDateOfBirth ? layaway.customerDateOfBirth.toISOString() : null,
            phoneNumber: layaway.customerPhoneNumber ?? null,
            cellPhone: layaway.customerCellPhone ?? null,
            email: layaway.customerEmail ?? null,
          },
          note: layaway.note,
          status: layaway.status,
          defaultDate: layaway.defaultDate ? layaway.defaultDate.toISOString() : null,
          totalOfPayments: layaway.totalOfPayments,
          period: layaway.period,
          extraNote: layaway.extraNote,
          gunProcFee: layaway.gunProcFee,
          lastUpdatedUserId: layaway.lastUpdatedUserId,
          createdAt: layaway.createdAt.toISOString(),
          updatedAt: layaway.updatedAt.toISOString(),
          items: []
        });
      }

      // Add item to the group
      const group = groupedMap.get(controlNumber)!;
      group.items.push(toLayawayItemDto(layaway));
    }

    return Array.from(groupedMap.values());
  }
}
