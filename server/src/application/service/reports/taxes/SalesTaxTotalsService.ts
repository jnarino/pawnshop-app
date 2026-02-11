import { SalesTaxRecord } from '../../../../domains/reports/taxes/SalesTaxRecord';
import { SalesTaxTotalsResponseDto } from '../../../dto/reports/taxes/query/SalesTaxTotalsResponseDto';

export class SalesTaxTotalsService {
  constructor(private readonly stateTaxRate: number) { }

  calculate(records: SalesTaxRecord[]): SalesTaxTotalsResponseDto {
    const grossSales = this.sum(records, (record) => record.grossAmount);
    const taxableSales = this.sum(records, (record) => record.taxableAmount);
    const exemptSales = grossSales - taxableSales;
    const stateTaxCollected = this.sum(records, (record) => record.taxCollected);

    const stateTaxCalculated = this.roundToCents(taxableSales * this.stateTaxRate);
    const countyTaxCalculated = 0;
    const localTaxCalculated = 0;

    const stateAllowanceBase = Math.min(stateTaxCalculated, 1200);
    const stateCollectionAllowance = this.roundToCents(Math.min(stateAllowanceBase * 0.025, 30));

    const collectionAllowances = {
      stateTax: stateCollectionAllowance,
      countyTax: 0,
      localTax: 0,
    };

    const amountDueWithReturn =
      stateTaxCalculated +
      countyTaxCalculated +
      localTaxCalculated -
      (collectionAllowances.stateTax + collectionAllowances.countyTax + collectionAllowances.localTax);

    return {
      stateTax: {
        collected: stateTaxCollected,
        taxRate: this.stateTaxRate,
      },
      countyTax: {
        collected: 0,
        taxRate: null,
      },
      localTax: {
        collected: 0,
        taxRate: null,
      },
      grossSales,
      exemptSales,
      taxableSales,
      stateTaxCalculated,
      countyTaxCalculated,
      localTaxCalculated,
      collectionAllowances,
      amountDueWithReturn,
    };
  }

  private sum(records: SalesTaxRecord[], selector: (record: SalesTaxRecord) => number): number {
    return records.reduce((total, record) => total + selector(record), 0);
  }

  private roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
