import { LayawayRepository } from '../../../../domains/layaway/LayawayRepository';
import { GetLayawaysByCustomerRequestDto, getLayawaysByCustomerRequestSchema } from '../../../dto/layaway/query/GetLayawaysByCustomerRequestDto';
import { LayawayResponseDto } from '../../../dto/layaway/query/LayawayResponseDto';
import { toLayawayItemDto } from '../../../mapping/layaway/layawayMapper';
import { LayawayAgreement } from '../../../../domains/layaway/LayawayAgreement';

export class GetLayawaysByCustomerUseCase {
  constructor(private readonly layawayRepo: LayawayRepository) {}

  async execute(input: unknown): Promise<LayawayResponseDto[]> {
    const criteria: GetLayawaysByCustomerRequestDto = getLayawaysByCustomerRequestSchema.parse(input);

    const flatLayaways = await this.layawayRepo.findByCriteria({
      customerId: criteria.customerId,
      status: criteria.status
    });

    // Grouping logic (Duplicates GetLayawaysUseCase logic - could be refactored)
    const groupedMap = new Map<string, LayawayResponseDto>();

    for (const layaway of flatLayaways) {
      const ticketnum = layaway.ticketnum;
      if (!ticketnum) continue; 

      if (!groupedMap.has(ticketnum)) {
        groupedMap.set(ticketnum, {
          id: layaway.id,
          ticketnum: layaway.ticketnum,
          clerkUserId: layaway.clerkUserId,
          dateIn: layaway.dateIn ? layaway.dateIn.toISOString() : null,
          lastUpdatedAt: layaway.lastUpdatedAt ? layaway.lastUpdatedAt.toISOString() : null,
          amount: layaway.amount,
          taxSales: layaway.taxSales,
          stateTax: layaway.stateTax,
          returnedAmt: layaway.returnedAmt,
          customerId: layaway.customerId,
          customerFirstName: layaway.customerFirstName,
          customerLastName: layaway.customerLastName,
          customerDateOfBirth: layaway.customerDateOfBirth ? layaway.customerDateOfBirth.toISOString() : null,
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

      const group = groupedMap.get(ticketnum)!;
      group.items.push(toLayawayItemDto(layaway));
    }

    return Array.from(groupedMap.values());
  }
}
