import { PawnTicket } from '../../../domains/pawnTicket/PawnTicket';
import { PawnTicketResponseDto } from '../../dto/pawnTicket/query/PawnTicketResponseDto';
import { toInventoryItemResponseDto } from '../inventory/inventoryItemMappers';

export class PawnTicketMapper {
  static toResponseDto(
    ticket: PawnTicket,
    charges?: { currentCharges?: number; periodsBehind?: number; redemptionAmount?: number }
  ): PawnTicketResponseDto {
    const { currentCharges, periodsBehind, redemptionAmount } = charges || {};
    return {
      id: ticket.id,
      controlNumber: ticket.controlNumber,
      transactionType: ticket.transactionType,
      customerId: ticket.customerId,
      clerkUserId: ticket.clerkUserId,
      clerkUsername: ticket.clerkUsername || '',
      itemIds: ticket.itemIds,
      amountFinanced: ticket.amountFinanced,
      originalPawnAmount: ticket.originalPawnAmount,
      periodicRate: ticket.periodicRate,
      apr: ticket.apr,
      purchaseTradeValue: ticket.purchaseTradeValue,
      transactionDate: ticket.transactionDate.toISOString(),
      maturityDate: ticket.maturityDate.toISOString(),
      defaultDate: ticket.defaultDate.toISOString(),
      createdDate: ticket.createdDate.toISOString(),
      totalOfPayments: ticket.totalOfPayments,
      pawnStatus: ticket.pawnStatus,
      items: ticket.items ? ticket.items.map(toInventoryItemResponseDto) : [],
      note: ticket.note,
      currentCharges,
      periodsBehind,
      redemptionAmount,
      customer: {
        firstName: ticket.customer?.firstName || '',
        lastName: ticket.customer?.lastName || ''
      }
    };
  }
}
