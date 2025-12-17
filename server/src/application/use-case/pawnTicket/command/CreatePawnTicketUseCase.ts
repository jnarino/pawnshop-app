import { randomUUID } from 'crypto';
import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../../domains/pawnTicket/PawnTicket';
import {
  createPawnTicketRequestSchema,
  CreatePawnTicketRequestDto
} from '../../../dto/pawnTicket/command/CreatePawnTicketRequestDto';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

/**
 * INTERNAL USE ONLY
 * 
 * This use case is called internally by CreatePawnTicketWithItemsUseCase within a transaction.
 * It should NEVER be exposed directly via a controller or route.
 * 
 * Business Rule: All pawn tickets MUST have at least one item.
 * This validation is enforced by CreatePawnTicketWithItemsUseCase before calling this use case.
 */
export class CreatePawnTicketUseCase {
  constructor(
    private readonly pawnTicketRepository: PawnTicketRepository
  ) {}

  async execute(input: unknown): Promise<PawnTicketResponseDto> {
    const dto: CreatePawnTicketRequestDto =
      createPawnTicketRequestSchema.parse(input);

    const transactionDate = new Date(dto.transactionDate);
    const maturityDate = new Date(dto.maturityDate);
    const defaultDate = new Date(dto.defaultDate);

    // Calculate finance values for PAWN transactions
    let financeCharge: number | null = null;
    let apr: number | null = null;

    if (dto.transactionType === 'PAWN' && dto.amountFinanced && dto.periodicRate != null) {
      // Calculate financeCharge from periodicRate
      // financeCharge = amountFinanced * periodicRate
      financeCharge = dto.amountFinanced * dto.periodicRate;

      // Calculate APR from periodicRate
      // APR = periodicRate * (365 / daysToMaturity) * 100
      // Example: 25% (0.25) over 30 days = 0.25 * (365/30) * 100 = 304.17%
      const daysToMaturity = Math.max(1, Math.floor((maturityDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)));
      apr = dto.periodicRate * (365 / daysToMaturity) * 100;
    }

    const ticket = new PawnTicket({
      id: randomUUID(),

      // NOTE: infrastructure will typically generate the real control number
      // using get_next_control_number(); this placeholder can be ignored
      // and overwritten by the repository implementation.
      controlNumber: '',

      transactionType: dto.transactionType,
      customerId: dto.customerId,
      clerkUserId: dto.clerkUserId,

      amountFinanced:
        dto.transactionType === 'PAWN' ? dto.amountFinanced! : null,
      financeCharge:
        dto.transactionType === 'PAWN' ? financeCharge : null,
      periodicRate:
        dto.transactionType === 'PAWN' ? dto.periodicRate! : null,
      totalOfPayments:
        dto.transactionType === 'PAWN' ? (dto.totalOfPayments ?? null) : null,
      apr:
        dto.transactionType === 'PAWN' ? apr : null,
      ratePlanId:
        dto.transactionType === 'PAWN' ? (dto.ratePlanId ?? null) : null,

      purchaseTradeValue:
        dto.transactionType === 'PURCHASE' ? dto.purchaseTradeValue! : null,

      transactionDate,
      maturityDate,
      defaultDate,
      createdDate: new Date(),

      pawnStatus: dto.transactionType === 'PAWN' ? 'P' : 'B',  // P = Pawn, B = Buy/Purchase
      itemIds: dto.itemIds,
      tenders: dto.tenders || [],
      note: dto.note
    });

    const saved = await this.pawnTicketRepository.create(ticket);
    return PawnTicketMapper.toResponseDto(saved);
  }
}
