import { randomUUID } from 'crypto';
import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import { PawnTicket } from '../../../../domains/pawnTicket/PawnTicket';
import {
  createPawnTicketRequestSchema,
  CreatePawnTicketRequestDto
} from '../../../dto/pawnTicket/command/CreatePawnTicketRequestDto';
import { PawnTicketMapper } from '../../../mapping/pawnTicket/pawnTicketMapper';
import { PawnTicketResponseDto } from '../../../dto/pawnTicket/query/PawnTicketResponseDto';

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

    const ticket = new PawnTicket({
      id: randomUUID(),

      // NOTE: infrastructure will typically generate the real control number
      // using get_next_control_number(); this placeholder can be ignored
      // and overwritten by the repository implementation.
      controlNumber: '',

      transactionType: dto.transactionType,
      customerId: dto.customerId,

      amountFinanced:
        dto.transactionType === 'PAWN' ? dto.amountFinanced! : null,
      purchaseTradeValue:
        dto.transactionType === 'PURCHASE' ? dto.purchaseTradeValue! : null,

      transactionDate,
      maturityDate,
      defaultDate,

      pawnStatus: 'active',
      itemIds: dto.itemIds
    });

    const saved = await this.pawnTicketRepository.create(ticket);
    return PawnTicketMapper.toResponseDto(saved);
  }
}
