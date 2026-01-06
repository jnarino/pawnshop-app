import { PullPawnTicketItemsToInventoryUseCase } from '../../../../../../src/application/use-case/pawnTicket/command/PullPawnTicketItemsToInventoryUseCase';
import { PawnTicketUnitOfWork } from '../../../../../../src/application/common/PawnTicketUnitOfWork';

const mkUow = (handlers: any): PawnTicketUnitOfWork => ({
  runInTransaction: jest.fn(async (fn) => {
    return fn({
      inventoryItemRepository: handlers.inventoryItemRepository,
      pawnTicketRepository: handlers.pawnTicketRepository,
      storeTransactionRepository: handlers.storeTransactionRepository ?? ({} as any),
      dbClient: handlers.dbClient ?? ({} as any)
    });
  })
}) as any;

describe('PullPawnTicketItemsToInventoryUseCase', () => {
  it('updates ticket and items, computes default minResale, and handles multiple scrap targets', async () => {
    const inventoryItemRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      findByInventoryNumber: jest.fn()
    } as any;
    const pawnTicketRepository = {
      findById: jest.fn(),
      updateMarkings: jest.fn(),
      setStatusByCode: jest.fn()
    } as any;

    // Pawn ticket mock
    const pawnTicket = {
      id: '00000000-0000-0000-0000-000000000001',
      transactionType: 'PAWN'
    } as any;
    pawnTicketRepository.findById.mockResolvedValue(pawnTicket);

    // Original item
    const originalItem = {
      id: 'item-1',
      status: 'P',
      quantity: 1,
      priceAmount: 100,
      resale: null,
      minResale: null,
      updatedAt: new Date()
    } as any;
    inventoryItemRepository.findById.mockResolvedValue(originalItem);

    // Target scrap items
    const targetItem1 = {
      id: 'scrap-target-1',
      quantity: 2,
      updatedAt: new Date()
    } as any;
    const targetItem2 = {
      id: 'scrap-target-2',
      quantity: 5,
      updatedAt: new Date()
    } as any;
    inventoryItemRepository.findByInventoryNumber
      .mockResolvedValueOnce(targetItem1)
      .mockResolvedValueOnce(targetItem2);

    const useCase = new PullPawnTicketItemsToInventoryUseCase(mkUow({ inventoryItemRepository, pawnTicketRepository }));

    const result = await useCase.execute({
      pawnTicketId: '00000000-0000-0000-0000-000000000001',
      controlNumber: 'CN-1',
      typeTicket: 'PAWN',
      clerkUserId: '00000000-0000-0000-0000-000000000002',
      transactionDate: new Date().toISOString(),
      items: [
        {
          id: '00000000-0000-0000-0000-000000000003',
          scrappedIntoInvItem: [
            { inventoryNumber: 'INV-999', quantity: 3 },
            { inventoryNumber: 'INV-888', quantity: 2 }
          ],
          resale: undefined,
          minResale: undefined
        }
      ]
    });

    expect(result).toEqual([]); // scrapped items are omitted from response

    // Verify pawn ticket status lookup and update with all parameters
    expect(pawnTicketRepository.setStatusByCode).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      'D',
      'PAWN',
      expect.any(Date),
      '00000000-0000-0000-0000-000000000002'
    );

    // Original item updated -> status 'J' due to scrap, quantity unchanged, resale default from priceAmount (100), minResale 80
    expect(inventoryItemRepository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'item-1',
      status: 'J',
      quantity: 1,
      resale: 100,
      minResale: 80
    }));

    // Target item 1 quantity incremented by 3
    expect(inventoryItemRepository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'scrap-target-1',
      quantity: 5
    }));

    // Target item 2 quantity incremented by 2
    expect(inventoryItemRepository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'scrap-target-2',
      quantity: 7
    }));
  });

  it('returns inventory numbers for non-scrapped items', async () => {
    const inventoryItemRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      findByInventoryNumber: jest.fn()
    } as any;
    const pawnTicketRepository = {
      findById: jest.fn(),
      updateMarkings: jest.fn(),
      setStatusByCode: jest.fn()
    } as any;

    // Pawn ticket mock
    const pawnTicket = {
      id: '00000000-0000-0000-0000-000000000010',
      transactionType: 'PAWN'
    } as any;
    pawnTicketRepository.findById.mockResolvedValue(pawnTicket);

    const item = {
      id: 'item-2',
      status: 'P',
      quantity: 1,
      priceAmount: 200,
      resale: null,
      minResale: null,
      inventoryNumber: 'INV-123',
      updatedAt: new Date()
    } as any;
    inventoryItemRepository.findById.mockResolvedValue(item);

    const useCase = new PullPawnTicketItemsToInventoryUseCase(mkUow({ inventoryItemRepository, pawnTicketRepository }));

    const result = await useCase.execute({
      pawnTicketId: '00000000-0000-0000-0000-000000000010',
      controlNumber: 'CN-2',
      typeTicket: 'PAWN',
      clerkUserId: '00000000-0000-0000-0000-000000000011',
      transactionDate: new Date().toISOString(),
      items: [
        {
          id: '00000000-0000-0000-0000-000000000012',
          resale: undefined,
          minResale: undefined
        }
      ]
    });

    expect(result).toEqual([{ id: 'item-2', inventoryNumber: 'INV-123' }]);
  });
});
