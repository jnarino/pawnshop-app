import { LayawayAgreement } from '../../../domains/layaway/LayawayAgreement';

export function toLayawayItemDto(layaway: LayawayAgreement) {
  return {
    inventoryNumber: layaway.inventoryNumber,
    quantity: layaway.numberSold,
    lineAmount: layaway.itemAmount,
    description: layaway.description,
    taxExempt: layaway.taxExempt,
    returnSold: layaway.returnSold,
    status: layaway.itemStatus,
    countyTaxExempt: layaway.countyTaxExempt,
    itemLastUpdatedUserId: layaway.itemLastUpdatedUserId,
    inventoryItemId: layaway.itemsId,
  };
}

