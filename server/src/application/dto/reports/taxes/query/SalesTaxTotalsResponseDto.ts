export type SalesTaxRateDto = {
  collected: number;
  taxRate: number | null;
};

export type SalesTaxCollectionAllowancesDto = {
  stateTax: number;
  countyTax: number;
  localTax: number;
};

export type SalesTaxTotalsResponseDto = {
  stateTax: SalesTaxRateDto;
  countyTax: SalesTaxRateDto;
  localTax: SalesTaxRateDto;
  grossSales: number;
  exemptSales: number;
  taxableSales: number;
  stateTaxCalculated: number;
  countyTaxCalculated: number;
  localTaxCalculated: number;
  collectionAllowances: SalesTaxCollectionAllowancesDto;
  amountDueWithReturn: number;
};
