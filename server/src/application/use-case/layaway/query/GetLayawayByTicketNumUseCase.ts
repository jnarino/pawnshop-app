import { LayawayRepository } from '../../../../domains/layaway/LayawayRepository';
import { GetLayawayByTicketNumRequestDto, getLayawayByTicketNumRequestSchema } from '../../../dto/layaway/query/GetLayawayByTicketNumRequestDto';
import { LayawayResponseDto } from '../../../dto/layaway/query/LayawayResponseDto';
import { toLayawayItemDto } from '../../../mapping/layaway/layawayMapper';
import { NotFoundError } from '../../../common/errors';

export class GetLayawayByTicketNumUseCase {
  constructor(private readonly layawayRepo: LayawayRepository) {}

  async execute(input: unknown): Promise<LayawayResponseDto> {
    const { ticketnum } = getLayawayByTicketNumRequestSchema.parse(input);

    const flatLayaways = await this.layawayRepo.findByTicketNum(ticketnum);

    if (!flatLayaways || flatLayaways.length === 0) {
      throw new NotFoundError(`Layaway ticket ${ticketnum} not found`);
    }

    // Since we filtered by ticketnum, we assume all rows belong to the same ticket header.
    // We take the header info from the first row.
    const header = flatLayaways[0];

    // Build the DTO
    const result: LayawayResponseDto = {
        id: header.id,
        ticketnum: header.ticketnum,
        clerkUserId: header.clerkUserId,
        dateIn: header.dateIn ? header.dateIn.toISOString() : null,
        lastUpdatedAt: header.lastUpdatedAt ? header.lastUpdatedAt.toISOString() : null,
        amount: header.amount,
        taxSales: header.taxSales,
        stateTax: header.stateTax,
        returnedAmt: header.returnedAmt,
        customer: {
            id: header.customerId,
            firstName: header.customerFirstName ?? null,
            middleName: header.customerMiddleName ?? null,
            lastName: header.customerLastName ?? null,
            dateOfBirth: header.customerDateOfBirth ? header.customerDateOfBirth.toISOString() : null,
            phoneNumber: header.customerPhoneNumber ?? null,
            cellPhone: header.customerCellPhone ?? null,
            email: header.customerEmail ?? null,
        },
        note: header.note,
        status: header.status,
        defaultDate: header.defaultDate ? header.defaultDate.toISOString() : null,
        totalOfPayments: header.totalOfPayments,
        period: header.period,
        extraNote: header.extraNote,
        gunProcFee: header.gunProcFee,
        lastUpdatedUserId: header.lastUpdatedUserId,
        createdAt: header.createdAt.toISOString(),
        updatedAt: header.updatedAt.toISOString(),
        items: []
    };

    // Correctly map all items
    result.items = flatLayaways.map(l => toLayawayItemDto(l));

    return result;
  }
}
