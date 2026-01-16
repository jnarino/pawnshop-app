import { randomUUID } from 'crypto';
import { InventoryAttributeValue } from '../../../../domains/inventory/InventoryAttributeValue';
import { InventoryAttributeRepository } from '../../../../domains/inventory/InventoryAttributeRepository';
import { createInventoryAttributeValueRequestSchema } from '../../../dto/inventory/command/CreateInventoryAttributeValueRequestDto';

export class CreateInventoryAttributeValueUseCase {
    constructor(private readonly repo: InventoryAttributeRepository) { }

    async execute(input: unknown): Promise<InventoryAttributeValue> {
        const dto = createInventoryAttributeValueRequestSchema.parse(input);

        const attributeValue = new InventoryAttributeValue({
            id: randomUUID(),
            attributeTypeId: dto.attributeTypeId,
            value: dto.value.toUpperCase() 
        });

        return this.repo.createValue(attributeValue);
    }
}
