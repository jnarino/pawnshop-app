import { InventoryBrand } from '../../../domains/inventory/InventoryBrand';
import { InventoryBrandResponseDto } from '../../dto/inventory/query/InventoryBrandResponseDto';

export function toInventoryBrandResponseDto(brand: InventoryBrand): InventoryBrandResponseDto {
    return {
        id: brand.id,
        inventoryCategoryId: brand.inventoryCategoryId,
        name: brand.name,
        code: brand.code,
        isActive: brand.isActive
    };
}
