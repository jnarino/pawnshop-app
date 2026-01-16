import { randomUUID } from 'crypto';
import { InventorySubCategory } from '../../../../domains/inventory/InventorySubCategory';
import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { createInventorySubCategoryRequestSchema } from '../../../dto/inventory/command/CreateInventorySubCategoryRequestDto';

export class CreateInventorySubCategoryUseCase {
    constructor(private readonly repo: InventoryCategoryRepository) { }

    async execute(input: unknown): Promise<InventorySubCategory> {
        const dto = createInventorySubCategoryRequestSchema.parse(input);
        const code = await this.generateUniqueCode(dto.name);

        const subCategory = new InventorySubCategory({
            id: randomUUID(),
            inventoryCategoryId: dto.inventoryCategoryId,
            name: dto.name.toUpperCase(),
            code: code,
            isActive: true
        });

        return this.repo.createSubCategory(subCategory);
    }

    private async generateUniqueCode(name: string): Promise<string> {
        // 1. Base: First 3 letters, uppercase logic
        // Remove non-alphanumeric chars to be safe
        let cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanName.length === 0) cleanName = 'SUB'; // Fallback

        let base = cleanName.substring(0, 3).toUpperCase();
        if (base.length < 3) base = base.padEnd(3, 'X');

        // 2. Try the base code first
        let currentCode = base;
        let exists = await this.repo.existsSubCategoryByCode(currentCode);
        if (!exists) {
            return currentCode;
        }

        // 3. If collision, try appending a number or similar
        // Strategy: Base + "_" + (some counter or random)?
        // Let's try appending incrementing numbers.
        // For simplicity and to avoid too many DB calls, let's try a few known patterns or just a random suffix if needed.
        // But cleaner is to try suffix.

        // Actually the previous implementation had a logic or maybe we just try to find the next available.
        // Let's assume sequential for now? Or just random to be fast.
        // If I look at the user provided data: "BIK", "BIK_2100", "BIK_2101".
        // It seems like it uses "XXX" then "XXX_YYYY".

        // Let's try a loop
        let counter = 2100;
        while (exists) {
            currentCode = `${base}_${counter}`;
            exists = await this.repo.existsSubCategoryByCode(currentCode);
            counter++;
            // Safety break
            if (counter > 3000) throw new Error('Could not generate unique code');
        }

        return currentCode;
    }
}
