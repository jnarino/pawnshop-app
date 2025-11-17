import assert from 'assert';
import { CreateInventoryItemUseCase } from '../../../../application/useCase/inventory/CreateInventoryItemUseCase';
import type { IInventoryRepository, CreateInventoryItemDTO } from '../../../../domain/inventory/IInventoryRepository';
import type { PoolClient } from 'pg';
import { test } from '../../../testHarness';

// ✅ Mock repository following the updated interface
class MockInventoryRepository implements IInventoryRepository {
    private items: any[] = [];
    private sequence = 1;
    
    async createSingleItem(dto: CreateInventoryItemDTO): Promise<string> {
        const id = this.sequence.toString(); // ✅ Use .toString() instead of String()
        this.sequence++;
        this.items.push({ id, ...dto });
        return id;
    }
    
    async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO): Promise<string> {
        return this.createSingleItem(dto);
    }
    
    async findById(id: string) {
        return this.items.find(i => i.id === id) || null;
    }
    
    async findAll() {
        return this.items;
    }
    
    async update() {
        return true;
    }
    
    async delete() {
        return true;
    }
}

test('CreateInventoryItemUseCase: creates item with attributes', async () => {
    const repo = new MockInventoryRepository();
    const useCase = new CreateInventoryItemUseCase(repo);
    
    const id = await useCase.execute({
        categoryId: 'cat1',
        itemCondition: 'Good',
        quantity: 1,
        itemReplace: 500,
        itemDescription: 'Test item',
        attributes: { caliberGauge: '9MM' }
    });
    
    assert.strictEqual(id, '1');
    
    const item = await repo.findById(id);
    assert.strictEqual(item?.categoryId, 'cat1');
    assert.strictEqual(item?.itemCondition, 'Good');
    assert.deepStrictEqual(item?.attributes, { caliberGauge: '9MM' });
});

test('CreateInventoryItemUseCase: handles null colorId', async () => {
    const repo = new MockInventoryRepository();
    const useCase = new CreateInventoryItemUseCase(repo);
    
    const id = await useCase.execute({
        categoryId: 'cat2',
        colorId: null,
        itemDescription: 'No color item'
    });
    
    assert.strictEqual(id, '1');
    
    const item = await repo.findById(id);
    assert.strictEqual(item?.colorId, null);
});

test('CreateInventoryItemUseCase: validates required fields', async () => {
    const repo = new MockInventoryRepository();
    const useCase = new CreateInventoryItemUseCase(repo);
    
    try {
        await useCase.execute({} as any);
        assert.fail('Should have thrown validation error');
    } catch (error) {
        assert(error instanceof Error);
        assert(error.message.includes('categoryId'));
    }
});

test('CreateInventoryItemUseCase: sets default values', async () => {
    const repo = new MockInventoryRepository();
    const useCase = new CreateInventoryItemUseCase(repo);
    
    const id = await useCase.execute({
        categoryId: 'cat1',
        itemDescription: 'Default test'
    });
    
    const item = await repo.findById(id);
    assert.strictEqual(item?.quantity, 1); // Default quantity
    assert.deepStrictEqual(item?.attributes, {}); // Default empty attributes
});
