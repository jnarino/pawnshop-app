import { NotFoundError } from '../../../../common/errors';
import { ActivePawnReportRepository } from '../../../../../domains/reports/pawn/ActivePawnReportRepository';
import { ActivePawnRowResponseDto } from '../../../../dto/reports/pawn/query/ActivePawnRowResponseDto';
import { ActivePawnsReportResponseDto } from '../../../../dto/reports/pawn/query/ActivePawnsReportResponseDto';
import { GetActivePawnsRequestDto, getActivePawnsRequestSchema } from '../../../../dto/reports/pawn/query/GetActivePawnsRequestDto';
import { GetPawnTicketCurrentChargesUseCase } from '../../../pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { ActivePawnRecord } from '../../../../../domains/reports/pawn/ActivePawnRecord';

export class GetActivePawnsUseCase {
  constructor(
    private readonly repo: ActivePawnReportRepository,
    private readonly getPawnTicketCurrentChargesUseCase: GetPawnTicketCurrentChargesUseCase,
  ) {}

  async execute(input: unknown): Promise<ActivePawnsReportResponseDto> {
    const dto: GetActivePawnsRequestDto = getActivePawnsRequestSchema.parse(input);
    const records = await this.repo.findActive({
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
    });

    if (!records.length) {
      throw new NotFoundError('No active pawns found');
    }

    // Group by ticket number to aggregate items and attach current charges
    const grouped = new Map<string, { records: ActivePawnRecord[]; aggregateQuantity: number; aggregateItemAmount: number }>();
    for (const rec of records) {
      const existing = grouped.get(rec.ticketNumber);
      if (existing) {
        existing.records.push(rec);
        existing.aggregateQuantity += rec.quantity;
        existing.aggregateItemAmount += rec.itemAmount;
      } else {
        grouped.set(rec.ticketNumber, {
          records: [rec],
          aggregateQuantity: rec.quantity,
          aggregateItemAmount: rec.itemAmount,
        });
      }
    }

    const rows: ActivePawnRowResponseDto[] = [];
    let totalPawns = 0;
    let totalItems = 0;
    let totalPawnAmount = 0;
    let totalServiceChargesDue = 0;
    let totalPoliceHoldAmount = 0;

    for (const [, group] of grouped) {
      const first = group.records[0];
      const recordCount = group.records.length;
      totalPawns += 1;
      totalItems += recordCount;

      const charges = await this.getPawnTicketCurrentChargesUseCase.execute({ controlNumber: first.ticketNumber });

      // Per request: pawn amount = amount_financed (from SQL), service charges due = item_amount (sum by ticket)
      const pawnAmount = first.serviceChargeDue;
      const serviceChargeDue = charges.currentCharges ?? 0;

      totalPawnAmount += pawnAmount;
      totalServiceChargesDue += serviceChargeDue;
      if ((first.status ?? '').toUpperCase() === 'H') {
        totalPoliceHoldAmount += pawnAmount;
      }

      rows.push({
        pawnTicketId: first.pawnTicketId,
        ticketNumber: first.ticketNumber,
        customer: first.customerName,
        employee: first.employeeUsername,
        dateIn: first.dateIn.toISOString(),
        dateOut: first.dateOut.toISOString(),
        serviceChargeDue,
        currentCharges: charges.currentCharges ?? 0,
        pawnAmount,
        itemAmount: group.aggregateItemAmount,
        quantity: group.aggregateQuantity,
        itemDescription: first.itemDescription,
        status: first.status,
        itemsCount: recordCount,
        items: group.records.map((item) => ({
          description: item.itemDescription,
          amount: item.itemAmount,
          quantity: item.quantity,
          brand: item.brand,
          model: item.model,
          serialNumber: item.serialNumber,
          extra: item.extra,
          attributes: item.attributes,
        })),
      });
    }

    return {
      rows,
      totals: {
        totalPawns,
        totalItems,
        totalPawnAmount,
        totalServiceChargesDue,
        totalPoliceHoldAmount,
      },
    };
  }
}
