import assert from 'assert';
import { test } from '../../../testHarness';
import type { PoolClient } from 'pg';
import type { IInventoryRepository, CreateInventoryItemDTO } from '../../../../domain/inventory/IInventoryRepository';
import type { CreatePawnTicketInput } from '../../../../domain/pawnTicket/PawnTicket';
import { CreateInventoryItemUseCase } from '../../../../application/useCase/inventory/CreateInventoryItemUseCase';
import { CreatePawnTicketUseCase } from '../../../../application/useCase/pawnTicket/CreatePawnTicketUseCase';

// ✅ Add mock repositories
class MockCustomerRepo {
  async lockCustomer() { return { id: 'cust1', firstName: 'John', lastName: 'Doe' }; }
  async unlockCustomer() { }
}

class MockRatePlanRepo {
  async findFirstActive() { 
    return { 
      id: 'plan1', 
      period_days: 30, 
      grace_days: 30, 
      periodic_rate: 0.25, 
      min_finance_charge: 5.00 
    }; 
  }
}

class MockStoreTransactionRepo {
  async createDisbursement() { return { id: 'tx1' }; }
}

class MockGunlogRepo {
  async isFirearmCategory() { return false; }
}

class MockInventoryRepo implements IInventoryRepository {
    async createSingleItem(dto: CreateInventoryItemDTO) { return 'item-123'; }
    async createInTransaction(client: PoolClient, dto: CreateInventoryItemDTO) { return 'item-123'; }
    async findById() { return null; }
    async findAll() { return []; }
    async update() { return false; }
    async delete() { return false; }
}

// ✅ Add missing MockPawnTicketRepo class
class MockPawnTicketRepo {
  tickets: any[] = [];
  seq = 1;

  async getNextControlNumber() { return String(100000 + this.seq); }
  
  async createInTransaction(client: any, ticket: any) {
    const id = String(this.seq++);
    this.tickets.push({ ...ticket, id });
    return id;
  }
  
  async findById() { return null; }
  async findAll() { return []; }
  async update() { return false; }
  async delete() { return false; }
  async search() { return []; }
}

test('application/useCase/pawnTicket: CreatePawnTicketUseCase basic creation', async () => {
    const pawnTicketRepo = new MockPawnTicketRepo();
    const customerRepo = new MockCustomerRepo();
    const ratePlanRepo = new MockRatePlanRepo();
    const storeTransactionRepo = new MockStoreTransactionRepo();
    const gunlogRepo = new MockGunlogRepo();
    const createInventoryUseCase = new CreateInventoryItemUseCase(new MockInventoryRepo());
    
    const useCase = new CreatePawnTicketUseCase(
        pawnTicketRepo as any,
        customerRepo as any,
        ratePlanRepo as any,
        storeTransactionRepo as any,
        gunlogRepo as any,
        createInventoryUseCase
    );

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

    const result = await useCase.execute(input);
    assert.strictEqual(typeof result, 'object');
    assert.ok(result.pawnTicket?.id);
});
