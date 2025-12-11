import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { InventoryCategoryResponseDto } from '../../../dto/inventory/query/InventoryCategoryResponseDto';
import { InventoryCategoryMapper } from '../../../mapping/inventory/inventoryCategoryMapper';

export class GetBrandsByCategoryRootUseCase {
    constructor(
        private readonly inventoryCategoryRepository: InventoryCategoryRepository
    ) { }

    async execute(categoryId: string): Promise<InventoryCategoryResponseDto[]> {
        const brands = await this.inventoryCategoryRepository.getBrandsGivenCategoryRoot(categoryId);
        return brands.map(InventoryCategoryMapper.toCategoryDto);
    }
}