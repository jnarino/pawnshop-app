import { LayawayAgreement } from '../../../domains/layaway/LayawayAgreement';
import { LayawayResponseDto } from '../../dto/layaway/query/LayawayResponseDto';

export function toLayawayResponseDto(layaway: LayawayAgreement): LayawayResponseDto {
  return {
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
    note: layaway.note,
    status: layaway.status,
    defaultDate: layaway.defaultDate ? layaway.defaultDate.toISOString() : null,
    totalOfPayments: layaway.totalOfPayments,
    period: layaway.period,
    extraNote: layaway.extraNote,
    gunProcFee: layaway.gunProcFee,
    lastUpdatedUserId: layaway.lastUpdatedUserId,
    inventoryNumber: layaway.inventoryNumber,
    numberSold: layaway.numberSold,
    itemAmount: layaway.itemAmount,
    description: layaway.description,
    taxExempt: layaway.taxExempt,
    returnSold: layaway.returnSold,
    itemStatus: layaway.itemStatus,
    countyTaxExempt: layaway.countyTaxExempt,
    itemLastUpdatedUserId: layaway.itemLastUpdatedUserId,
    itemsId: layaway.itemsId,
    createdAt: layaway.createdAt.toISOString(),
    updatedAt: layaway.updatedAt.toISOString(),
  };
}
