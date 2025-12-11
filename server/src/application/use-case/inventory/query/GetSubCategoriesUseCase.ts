import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { InventoryCategoryResponseDto } from '../../../dto/inventory/query/InventoryCategoryResponseDto';
import { InventoryCategoryMapper } from '../../../mapping/inventory/inventoryCategoryMapper';


export class GetSubCategoriesUseCase {
    constructor(
        private readonly inventoryCategoryRepository: InventoryCategoryRepository
    ) { }

    async execute(categoryId: string): Promise<InventoryCategoryResponseDto[]> {
        const subCategories = await this.inventoryCategoryRepository.getSubcategoriesGivenCategoryRoot(categoryId);
        return subCategories.map(InventoryCategoryMapper.toCategoryDto);
    }
}