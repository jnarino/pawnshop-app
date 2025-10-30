import assert from 'assert';
import { test } from '../../../testHarness';
import type { PoolClient } from 'pg';
import type { IInventoryRepository, CreateInventoryItemDTO } from '../../../../domain/inventory/IInventoryRepository';
import type { CreatePawnTicketInput } from '../../../../domain/pawnTicket/PawnTicket';
import { CreateInventoryItemUseCase } from '../../../../application/useCase/inventory/CreateInventoryItemUseCase';
import { CreatePawnTicketUseCase } from '../../../../application/useCase/pawnTicket/CreatePawnTicketUseCase';

class MockInventoryRepo implements IInventoryRepository {
    async createSingleItem(dto: CreateInventoryItemDTO) { return 'item-123'; }
    async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO) { return 'item-123'; }
    async findById() { return null; }
    async findAll() { return []; }
    async update() { return false; }
    async delete() { return false; }
}

class MockPawnTicketRepo {
    async createSingleTicket() { return 'ticket-123'; }
    async createInTransaction() { return 'ticket-123'; }
}

test('application/useCase/pawnTicket: CreatePawnTicketUseCase creates ticket with new items', async () => {
    const inventoryRepo = new MockInventoryRepo();
    const pawnTicketRepo = new MockPawnTicketRepo() as any;

    const createInventoryUseCase = new CreateInventoryItemUseCase(inventoryRepo);
    const useCase = new CreatePawnTicketUseCase(pawnTicketRepo, createInventoryUseCase);

    const input: CreatePawnTicketInput = {
        type: 'PAWN',
        customerId: 'cust-456',
        amountFinanced: 500,
        newInventoryItems: [{
            categoryId: 'cat-uuid-789',
            brand: 'TestBrand',
            itemDescription: 'Test item'
        }]
    };

    const ticketId = await useCase.execute(input);
    assert.strictEqual(typeof ticketId, 'string');
    assert.ok(ticketId.length > 0);
});
