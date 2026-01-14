import { PawnTicketRepository } from '../../../../domains/pawnTicket/PawnTicketRepository';
import {
  ListHistoryPawnsByCustomerRequestDto,
  listHistoryPawnsByCustomerRequestSchema,
  PawnHistoryResponseDto
} from '../../../dto/pawnTicket/query/ListHistoryPawnsByCustomerDto';
import { toPawnHistoryResponseDto } from '../../../mapping/pawnTicket/pawnHistoryMapper';

export class ListHistoryPawnsByCustomerUseCase {
  constructor(private readonly pawnTicketRepo: PawnTicketRepository) {}

  async execute(input: unknown): Promise<PawnHistoryResponseDto[]> {
    // 1. Validate input
    const { customerId }: ListHistoryPawnsByCustomerRequestDto =
      listHistoryPawnsByCustomerRequestSchema.parse(input);

    // 2. Get pawn history from repository
    const historyRows = await this.pawnTicketRepo.listHistoryByCustomer(customerId);

    // 3. Map to DTOs
    return historyRows.map(toPawnHistoryResponseDto);
  }
}
