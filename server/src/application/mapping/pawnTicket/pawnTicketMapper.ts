import { PawnTicket } from '../../../domains/pawnTicket/PawnTicket';
import { PawnTicketResponseDto } from '../../dto/pawnTicket/query/PawnTicketResponseDto';
import { toInventoryItemResponseDto } from '../inventory/inventoryItemMappers';

export class PawnTicketMapper {
  static toResponseDto(ticket: PawnTicket): PawnTicketResponseDto {
    return {
      id: ticket.id,
      controlNumber: ticket.controlNumber,
      transactionType: ticket.transactionType,
      customerId: ticket.customerId,
      clerkUserId: ticket.clerkUserId,
      amountFinanced: ticket.amountFinanced,
      originalPawnAmount: ticket.originalPawnAmount,
      periodicRate: ticket.periodicRate,
      apr: ticket.apr,
      purchaseTradeValue: ticket.purchaseTradeValue,
      transactionDate: ticket.transactionDate.toISOString(),
      maturityDate: ticket.maturityDate.toISOString(),
      defaultDate: ticket.defaultDate.toISOString(),
      createdDate: ticket.createdDate.toISOString(),
      pawnStatus: ticket.pawnStatus,
      items: ticket.items ? ticket.items.map(toInventoryItemResponseDto) : [],
      tenders: ticket.tenders,
      note: ticket.note
    };
  }
}
