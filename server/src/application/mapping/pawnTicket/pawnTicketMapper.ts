import { PawnTicket } from '../../../domains/pawnTicket/PawnTicket';
import { PawnTicketResponseDto } from '../../dto/pawnTicket/query/PawnTicketResponseDto';

export class PawnTicketMapper {
  static toResponseDto(ticket: PawnTicket): PawnTicketResponseDto {
    return {
      id: ticket.id,
      controlNumber: ticket.controlNumber,
      transactionType: ticket.transactionType,
      customerId: ticket.customerId,
      amountFinanced: ticket.amountFinanced,
      purchaseTradeValue: ticket.purchaseTradeValue,
      transactionDate: ticket.transactionDate.toISOString(),
      maturityDate: ticket.maturityDate.toISOString(),
      defaultDate: ticket.defaultDate.toISOString(),
      pawnStatus: ticket.pawnStatus,
      itemIds: ticket.itemIds
    };
  }
}
