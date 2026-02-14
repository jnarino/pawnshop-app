import { NotFoundError } from '../../../../common/errors';
import { InventoryReportRepository } from '../../../../../domains/reports/inventory/InventoryReportRepository';
import { InventoryReportResponseDto } from '../../../../dto/reports/inventory/query/InventoryReportResponseDto';
import { GetAllItemsInventoryRequestDto, getAllItemsInventoryRequestSchema } from '../../../../dto/reports/inventory/query/GetAllItemsInventoryRequestDto';
import { toInventoryItemRowDto } from '../../../../mapping/reports/inventory/inventoryReportMapper';

export class GetAllItemsInventoryUseCase {
  constructor(private readonly repo: InventoryReportRepository) {}

  async execute(input: unknown): Promise<InventoryReportResponseDto> {
    const dto: GetAllItemsInventoryRequestDto = getAllItemsInventoryRequestSchema.parse(input);
    // dto currently unused but parsed for future filters
    void dto;

    const records = await this.repo.findAllItems();
    if (!records.length) {
      throw new NotFoundError('No inventory items found');
    }

    const totals = records.reduce(
      (acc, record) => {
        acc.totalItems += 1;
        acc.totalQuantity += record.quantity;
        acc.totalCost += record.cost;
        acc.totalResale += record.resale;
        return acc;
      },
      { totalItems: 0, totalQuantity: 0, totalCost: 0, totalResale: 0 }
    );

    const rows = records.map(toInventoryItemRowDto);

    return {
      rows,
      totals,
    };
  }
}
