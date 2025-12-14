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
  it('should create PAWN transaction with finance details', async () => {
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
        financeCharge: 75,
        periodicRate: 0.15,
        totalOfPayments: 575,
        apr: 180,
        ratePlanId: 'aa111111-1111-1111-1111-111111111111',
        transactionDate: today.toISOString(),
        maturityDate: maturity.toISOString(),
        defaultDate: defaultDate.toISOString()
      },
      items: [
        {
          inventorySubcategoryId: '33333333-3333-3333-3333-333333333333',
          brand: '44444444-4444-4444-4444-444444444444',
          priceAmount: 100,
          status: 'I',
          quantity: 1,
          model: 'iPhone'
        }
      ]
    });

    expect(result.transactionType).toBe('PAWN');
    expect(result.amountFinanced).toBe(500);
    expect(result.financeCharge).toBe(75);
    expect(result.periodicRate).toBe(0.15);
    // Note: items array is only populated on query operations with JOIN, not on create
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should create PURCHASE transaction without finance details', async () => {
    const uow = new MockPawnTicketUnitOfWork();
    const useCase = new CreatePawnTicketWithItemsUseCase(uow);

    const today = new Date();
    const maturity = new Date(today);
    maturity.setDate(maturity.getDate() + 30);
    const defaultDate = new Date(maturity);
    defaultDate.setDate(defaultDate.getDate() + 30);

    const result = await useCase.execute({
      pawn: {
        transactionType: 'PURCHASE',
        customerId: '11111111-1111-1111-1111-111111111111',
        clerkUserId: '22222222-2222-2222-2222-222222222222',
        purchaseTradeValue: 300,
        transactionDate: today.toISOString(),
        maturityDate: maturity.toISOString(),
        defaultDate: defaultDate.toISOString()
      },
      items: [
        {
          inventorySubcategoryId: '66666666-6666-6666-6666-666666666666',
          brand: '77777777-7777-7777-7777-777777777777',
          priceAmount: 300,
          status: 'I',
          quantity: 1,
          model: 'Gold Ring'
        }
      ]
    });

    expect(result.transactionType).toBe('PURCHASE');
    expect(result.purchaseTradeValue).toBe(300);
    expect(result.amountFinanced).toBeNull();
    // Note: items array is only populated on query operations with JOIN, not on create
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should throw error when no items are provided', async () => {
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
          defaultDate: defaultDate.toISOString()
        },
        items: [] // Empty array
      })
    ).rejects.toThrow('At least one item must be provided');
  });
});
