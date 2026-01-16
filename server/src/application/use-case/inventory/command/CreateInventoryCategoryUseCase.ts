import { randomUUID } from 'crypto';
import { InventoryCategory } from '../../../../domains/inventory/InventoryCategory';
import { InventoryCategoryRepository } from '../../../../domains/inventory/InventoryCategoryRepository';
import { createInventoryCategoryRequestSchema } from '../../../dto/inventory/command/CreateInventoryCategoryRequestDto';

export class CreateInventoryCategoryUseCase {
    constructor(private readonly repo: InventoryCategoryRepository) { }

    async execute(input: unknown): Promise<InventoryCategory> {
        const dto = createInventoryCategoryRequestSchema.parse(input);
        const code = await this.generateUniqueCode(dto.name);

        const category = new InventoryCategory({
            id: randomUUID(),
            name: dto.name.toUpperCase(),
            code: code,
            isActive: true
        });

        return this.repo.create(category);
    }

    private async generateUniqueCode(name: string): Promise<string> {
        // 1. Base: First 3 letters, uppercase logic
        // Remove non-alphanumeric chars to be safe, though existing codes are simple
        let cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanName.length === 0) cleanName = 'GEN';

        let base = cleanName.substring(0, 3).toUpperCase();
        if (base.length < 3) base = base.padEnd(3, 'X');

        // 2. Check existence of base (XXX)
        if (!(await this.repo.existsByCode(base))) {
            return base;
        }

        // 3. Try with suffix _100, _200 ... 
        // Logic: Try suffix until unique. 
        // Existing DB suggests _1100, _1500, _2000.  
        // I will just use sequential _1, _2 is simpler unless there's a specific requirement.
        // User asked: "so you know how to do the insert and how to create a uniqie code"
        // I'll stick to a simple strategy incrementing suffix.
        
        let counter = 1;
        while (true) {
            const candidate = `${base}_${counter}`;
            if (!(await this.repo.existsByCode(candidate))) {
                return candidate;
            }
            counter++;
            if (counter > 1000) throw new Error('Unable to generate unique category code - too many collisions');
        }
    }
}
