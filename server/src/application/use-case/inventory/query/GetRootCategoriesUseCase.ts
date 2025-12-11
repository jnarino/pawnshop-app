import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { InventoryCategoryResponseDto } from '../../../dto/inventory/query/InventoryCategoryResponseDto';
import { InventoryCategoryMapper } from '../../../mapping/inventory/inventoryCategoryMapper';

export class GetRootCategoriesUseCase {
    constructor(
        private readonly inventoryCategoryRepository: InventoryCategoryRepository
    ) { }

    async execute(): Promise<InventoryCategoryResponseDto[]> {
        const rootCategories = await this.inventoryCategoryRepository.getRootCategories();
        return rootCategories.map(InventoryCategoryMapper.toCategoryDto);
    }
}