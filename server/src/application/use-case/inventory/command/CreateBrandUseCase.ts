import { randomUUID } from 'crypto';
import { InventoryBrand } from '../../../../domains/inventory/InventoryBrand';
import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { CreateBrandRequestDto, createBrandRequestSchema } from '../../../dto/inventory/command/CreateBrandRequestDto';
import { InventoryBrandResponseDto } from '../../../dto/inventory/query/InventoryBrandResponseDto';
import { toInventoryBrandResponseDto } from '../../../mapping/inventory/inventoryBrandMapper';
import { NotFoundError } from '../../../common/errors';

export class CreateBrandUseCase {
    constructor(private readonly repo: InventoryCategoryRepository) { }

    async execute(input: unknown): Promise<InventoryBrandResponseDto> {
        const dto = createBrandRequestSchema.parse(input);
        
        // Ensure category exists
        // Wait, repo.getSubcategoriesGivenCategoryRoot uses queries, but we don't have a direct "findById" for category specifically exposed to check existence logic in the interface easily except implicitly. 
        // But foreign key constraint will catch it. 
        // Or I can use getRootCategories or similar?
        // Actually, for brands, it takes `inventory_category_id`. The DB constraint will handle invalid category_id, throwing an error.
        
        const code = await this.generateUniqueCode(dto.name);

        const brand = new InventoryBrand({
            id: randomUUID(),
            inventoryCategoryId: dto.inventoryCategoryId,
            name: dto.name.toUpperCase(),
            code: code,
            isActive: true
        });

        const created = await this.repo.createBrand(brand);
        return toInventoryBrandResponseDto(created);
    }

    private async generateUniqueCode(name: string): Promise<string> {
        // 1. Base: First 3 letters, uppercase logic
        let cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanName.length === 0) cleanName = 'GEN';

        let base = cleanName.substring(0, 3).toUpperCase();
        if (base.length < 3) base = base.padEnd(3, 'X');

        // 2. Check existence of base (XXX)
        if (!(await this.repo.existsBrandByCode(base))) {
            return base;
        }

        // 3. Try with suffix _XXXX (4 random digits) 
        // Matches pattern seen in user data: JBL_3398, AUT_1358
        let attempts = 0;
        while (attempts < 10) {
            const suffix = Math.floor(1000 + Math.random() * 9000); // 1000-9999
            const candidate = `${base}_${suffix}`;
            if (!(await this.repo.existsBrandByCode(candidate))) {
                return candidate;
            }
            attempts++;
        }
        
        // Fallback to sequential if random fails often
        let counter = 1;
        while (true) {
            const candidate = `${base}_${counter}`;
            if (!(await this.repo.existsBrandByCode(candidate))) {
                return candidate;
            }
            counter++;
            if (counter > 1000) throw new Error('Unable to generate unique brand code');
        }
    }
}
