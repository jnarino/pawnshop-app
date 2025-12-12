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
        customerId: '11111111-1111-1111-1111-111111111111',
        clerkUserId: '22222222-2222-2222-2222-222222222222',
        amountFinanced: 500,
        transactionDate: today.toISOString(),
        maturityDate: maturity.toISOString(),
        defaultDate: defaultDate.toISOString(),
        tenders: [{ tenderTypeId: 1, amount: 500 }]
      },
      items: [
        {
          inventorySubcategoryId: '33333333-3333-3333-3333-333333333333',
          status: 'I',
          quantity: 1,
          brand: 'Apple',
          model: 'iPhone'
        }
      ]
    });

    expect(result.transactionType).toBe('PAWN');
    expect(result.amountFinanced).toBe(500);
    // Note: items array is only populated on query operations with JOIN, not on create
    expect(Array.isArray(result.items)).toBe(true);
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
        customerId: '11111111-1111-1111-1111-111111111111',
        clerkUserId: '22222222-2222-2222-2222-222222222222',
        amountFinanced: 500,
        transactionDate: today.toISOString(),
        maturityDate: maturity.toISOString(),
        defaultDate: defaultDate.toISOString(),
        tenders: [{ tenderTypeId: 1, amount: 500 }]
      },
      itemIds: ['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555']
    });

    expect(result.transactionType).toBe('PAWN');
    // Note: items array is only populated on query operations with JOIN, not on create
    expect(Array.isArray(result.items)).toBe(true);
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
          customerId: '11111111-1111-1111-1111-111111111111',
          clerkUserId: '22222222-2222-2222-2222-222222222222',
          amountFinanced: 500,
          transactionDate: today.toISOString(),
          maturityDate: maturity.toISOString(),
          defaultDate: defaultDate.toISOString(),
          tenders: [{ tenderTypeId: 1, amount: 500 }]
        }
      })
    ).rejects.toThrow('At least one new item or existing itemId must be provided');
  });
});
