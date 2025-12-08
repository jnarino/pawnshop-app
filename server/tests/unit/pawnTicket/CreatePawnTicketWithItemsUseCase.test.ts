import { PawnTicketUnitOfWork } from '../../../src/application/common/PawnTicketUnitOfWork';
import { PawnTicketRepository } from '../../../src/domains/pawnTicket/PawnTicketRepository';
import { InventoryItemRepository } from '../../../src/domains/inventory/InventoryItemRepository';
import { PawnTicket } from '../../../src/domains/pawnTicket/PawnTicket';
import { InventoryItem } from '../../../src/domains/inventory/InventoryItem';
import { CreatePawnTicketWithItemsUseCase } from '../../../src/application/use-case/pawnTicket/command/CreatePawnTicketWithItemsUseCase';

class MockPawnTicketRepository implements PawnTicketRepository {
  create = jest.fn(async (t: PawnTicket) => ({
    ...t,
    controlNumber: 'CTL-001'
  }));
  listByControlNumber = jest.fn();
  findByCustomer = jest.fn();
  listActiveByCustomer = jest.fn();
}

class MockInventoryItemRepository implements InventoryItemRepository {
  create = jest.fn(async (i: InventoryItem) => i);
  update = jest.fn();
  delete = jest.fn();
  findById = jest.fn();
  findByInventoryNumber = jest.fn();
  findBySerialNumber = jest.fn();
}

class MockPawnTicketUnitOfWork implements PawnTicketUnitOfWork {
  async runInTransaction<T>(
    callback: (repos: {
      pawnTicketRepository: PawnTicketRepository;
      inventoryItemRepository: InventoryItemRepository;
    }) => Promise<T>
  ): Promise<T> {
    const pawnTicketRepository = new MockPawnTicketRepository();
    const inventoryItemRepository = new MockInventoryItemRepository();
    return callback({ pawnTicketRepository, inventoryItemRepository });
  }
}

describe('CreatePawnTicketWithItemsUseCase', () => {
  it('should create pawn ticket with new inventory items', async () => {
    const uow = new MockPawnTicketUnitOfWork();
    const useCase = new CreatePawnTicketWithItemsUseCase(uow);

    const today = new Date();
    const maturity = new Date(today);
    maturity.setDate(maturity.getDate() + 30);
    const defaultDate = new Date(maturity);
    defaultDate.setDate(defaultDate.getDate() + 30);

    const result = await useCase.execute({
      pawn: {
        transactionType: 'PAWN',
        customerId: 'cust-123',
        amountFinanced: 500,
        transactionDate: today.toISOString(),
        maturityDate: maturity.toISOString(),
        defaultDate: defaultDate.toISOString()
      },
      items: [
        {
          categoryId: 'cat-1',
          status: 'I',
          quantity: 1,
          brand: 'Apple',
          model: 'iPhone'
        }
      ]
    });

    expect(result.transactionType).toBe('PAWN');
    expect(result.amountFinanced).toBe(500);
    expect(result.itemIds).toBeDefined();
    expect(result.itemIds.length).toBeGreaterThan(0);
  });

  it('should create pawn ticket with existing item IDs', async () => {
    const uow = new MockPawnTicketUnitOfWork();
    const useCase = new CreatePawnTicketWithItemsUseCase(uow);

    const today = new Date();
    const maturity = new Date(today);
    maturity.setDate(maturity.getDate() + 30);
    const defaultDate = new Date(maturity);
    defaultDate.setDate(defaultDate.getDate() + 30);

    const result = await useCase.execute({
      pawn: {
        transactionType: 'PAWN',
        customerId: 'cust-123',
        amountFinanced: 500,
        transactionDate: today.toISOString(),
        maturityDate: maturity.toISOString(),
        defaultDate: defaultDate.toISOString()
      },
      itemIds: ['existing-item-1', 'existing-item-2']
    });

    expect(result.transactionType).toBe('PAWN');
    expect(result.itemIds).toContain('existing-item-1');
    expect(result.itemIds).toContain('existing-item-2');
  });

  it('should throw error if no items are provided', async () => {
    const uow = new MockPawnTicketUnitOfWork();
    const useCase = new CreatePawnTicketWithItemsUseCase(uow);

    const today = new Date();
    const maturity = new Date(today);
    maturity.setDate(maturity.getDate() + 30);
    const defaultDate = new Date(maturity);
    defaultDate.setDate(defaultDate.getDate() + 30);

    await expect(
      useCase.execute({
        pawn: {
          transactionType: 'PAWN',
          customerId: 'cust-123',
          amountFinanced: 500,
          transactionDate: today.toISOString(),
          maturityDate: maturity.toISOString(),
          defaultDate: defaultDate.toISOString()
        }
      })
    ).rejects.toThrow('Pawn ticket must have at least one linked item');
  });
});
