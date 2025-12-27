import { PullPawnTicketItemsToInventoryUseCase } from '../../../../../../src/application/use-case/pawnTicket/command/PullPawnTicketItemsToInventoryUseCase';
import { PawnTicketUnitOfWork } from '../../../../../../src/application/common/PawnTicketUnitOfWork';

const mkUow = (handlers: any): PawnTicketUnitOfWork => ({
  runInTransaction: jest.fn(async (fn) => {
    return fn({
      inventoryItemRepository: handlers.inventoryItemRepository,
      pawnTicketRepository: handlers.pawnTicketRepository,
      storeTransactionRepository: handlers.storeTransactionRepository ?? ({} as any),
      dbClient: {} as any
    });
  })
}) as any;

describe('PullPawnTicketItemsToInventoryUseCase', () => {
  it('updates ticket and items, computes default minResale, and handles scrap increment', async () => {
    const inventoryItemRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      findByInventoryNumber: jest.fn()
    } as any;
    const pawnTicketRepository = {
      setStatus: jest.fn(),
      updateMarkings: jest.fn()
    } as any;

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

    // Target scrap item
    const targetItem = {
      id: 'scrap-target',
      quantity: 2,
      updatedAt: new Date()
    } as any;
    inventoryItemRepository.findByInventoryNumber.mockResolvedValue(targetItem);

    const useCase = new PullPawnTicketItemsToInventoryUseCase(mkUow({ inventoryItemRepository, pawnTicketRepository }));

    await useCase.execute({
      pawnTicketId: '00000000-0000-0000-0000-000000000001',
      controlNumber: 'CN-1',
      typeTicket: 'PAWN',
      ticketStatus: 'D',
      defaultMarkedBy: '00000000-0000-0000-0000-000000000002',
      transactionDate: new Date().toISOString(),
      items: [
        {
          id: '00000000-0000-0000-0000-000000000003',
          quantity: 3,
          itemStatus: 'I',
          scrappedIntoInvItem: 'INV-999',
          resale: undefined,
          minResale: undefined
        }
      ]
    });

    expect(pawnTicketRepository.setStatus).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001', 'D');
    expect(pawnTicketRepository.updateMarkings).toHaveBeenCalled();

    // Original item updated -> status 'J' due to scrap, quantity 3, resale default from priceAmount (100), minResale 80
    expect(inventoryItemRepository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'item-1',
      status: 'J',
      quantity: 3,
      resale: 100,
      minResale: 80
    }));

    // Target item quantity incremented by 3
    expect(inventoryItemRepository.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'scrap-target',
      quantity: 5
    }));
  });
});
