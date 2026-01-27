import { LayawayRepository, FindDefaultedCriteria } from '../../../../domains/layaway/LayawayRepository';
import { LayawayResponseDto } from '../../../dto/layaway/query/LayawayResponseDto';
import { toLayawayItemDto } from '../../../mapping/layaway/layawayMapper';

export class GetDefaultedLayawaysUseCase {
  constructor(private readonly layawayRepo: LayawayRepository) {}

  async execute(input?: { startDate?: string; endDate?: string; ticketNumber?: string }): Promise<LayawayResponseDto[]> {
    const criteria: FindDefaultedCriteria = {};

    if (input?.ticketNumber) {
      criteria.ticketNumber = input.ticketNumber;
    } else if (input?.startDate && input?.endDate) {
      // Validate dates
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        criteria.startDate = start;
        criteria.endDate = end;
      }
    }
    
    const flatLayaways = await this.layawayRepo.findDefaulted(criteria);

    // Grouping logic (copied from GetLayawaysUseCase to keep consistent output format)
    const groupedMap = new Map<string, LayawayResponseDto>();

    for (const layaway of flatLayaways) {
      const controlNumber = layaway.ticketnum;
      if (!controlNumber) continue;

      if (!groupedMap.has(controlNumber)) {
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

      const group = groupedMap.get(controlNumber)!;
      group.items.push(toLayawayItemDto(layaway));
    }

    return Array.from(groupedMap.values());
  }
}
