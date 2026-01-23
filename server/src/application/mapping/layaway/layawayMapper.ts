import { LayawayAgreement } from '../../../domains/layaway/LayawayAgreement';

export function toLayawayItemDto(layaway: LayawayAgreement) {
  return {
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
  };
}

