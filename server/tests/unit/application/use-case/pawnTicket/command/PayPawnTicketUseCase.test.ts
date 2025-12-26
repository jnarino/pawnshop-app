import { PayPawnTicketUseCase } from '../../../../../../src/application/use-case/pawnTicket/command/PayPawnTicketUseCase';
import { PawnTicketRepository } from '../../../../../../src/domains/pawnTicket/PawnTicketRepository';
import { InventoryItemRepository } from '../../../../../../src/domains/inventory/InventoryItemRepository';
import { StoreTransactionRepository } from '../../../../../../src/domains/storeTransaction/StoreTransactionRepository';
import { GetPawnTicketCurrentChargesUseCase } from '../../../../../../src/application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { NotFoundError } from '../../../../../../src/application/common/errors';

describe('PayPawnTicketUseCase', () => {
  let pawnTicketRepository: jest.Mocked<PawnTicketRepository>;
  let inventoryItemRepository: jest.Mocked<InventoryItemRepository>;
  let storeTransactionRepository: jest.Mocked<StoreTransactionRepository>;
  let getPawnTicketCurrentChargesUseCase: jest.Mocked<GetPawnTicketCurrentChargesUseCase>;
  let pawnTicketUnitOfWork: any;
  let useCase: PayPawnTicketUseCase;

  beforeEach(() => {
    pawnTicketRepository = {
      updatePaymentFields: jest.fn(),
      addPayment: jest.fn(),
      setStatus: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    inventoryItemRepository = {
      setStatusByPawnTicket: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByInventoryNumber: jest.fn(),
      findAvailableByInventoryNumber: jest.fn(),
      findBySerialNumber: jest.fn(),
    } as any;
    storeTransactionRepository = {
      createPayment: jest.fn(),
    } as any;
    getPawnTicketCurrentChargesUseCase = {
      execute: jest.fn(),
    } as any;
    pawnTicketUnitOfWork = {
      runInTransaction: jest.fn(async (fn: any) => {
        return fn({
          inventoryItemRepository,
          pawnTicketRepository,
          storeTransactionRepository,
          dbClient: {} // mock client
        });
      })
    };
    useCase = new PayPawnTicketUseCase(
      pawnTicketUnitOfWork,
      getPawnTicketCurrentChargesUseCase
    );
  });

  it('should process a payment (not redemption)', async () => {
    getPawnTicketCurrentChargesUseCase.execute.mockResolvedValue({
      pawnTicketId: 'pt1',
      currentCharges: 0,
      pawnAmount: 0,
      periodsBehind: 0,
      redemptionAmount: 200
    });
    const input = {
      items: [{
        pawnTicketId: '60d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
        controlNumber: '116951',
        createdDate: new Date().toISOString(),
        amountPaid: 100
      }],
      tenders: [{
        id: '1',
        name: 'Cash',
        amount: 100,
        tenderTypeId: 1
      }],
      clerkUserId: '11111111-1111-1111-1111-111111111111'
    };
    await useCase.execute(input);
    expect(pawnTicketRepository.updatePaymentFields).toHaveBeenCalled();
    expect(storeTransactionRepository.createPayment).toHaveBeenCalledWith({
      pawnTicketId: '60d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
      clerkUserId: '11111111-1111-1111-1111-111111111111',
      typeId: 7,
      amount: 100,
      tender: { tenderTypeId: 1, amount: 100 }
    });
    expect(inventoryItemRepository.setStatusByPawnTicket).not.toHaveBeenCalled();
  });

  it('should process a redemption', async () => {
    getPawnTicketCurrentChargesUseCase.execute.mockResolvedValue({
      pawnTicketId: 'pt2',
      currentCharges: 0,
      pawnAmount: 0,
      periodsBehind: 0,
      redemptionAmount: 150
    });
    const input = {
      items: [{
        pawnTicketId: '70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
        controlNumber: '116952',
        createdDate: new Date().toISOString(),
        amountPaid: 200
      }],
      tenders: [{
        id: '2',
        name: 'Card',
        amount: 200,
        tenderTypeId: 2
      }],
      clerkUserId: '22222222-2222-2222-2222-222222222222'
    };
    await useCase.execute(input);
    expect(pawnTicketRepository.updatePaymentFields).toHaveBeenCalled();
    expect(storeTransactionRepository.createPayment).toHaveBeenCalledWith({
      pawnTicketId: '70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
      clerkUserId: '22222222-2222-2222-2222-222222222222',
      typeId: 8,
      amount: 200,
      tender: { tenderTypeId: 2, amount: 200 }
    });
    expect(inventoryItemRepository.setStatusByPawnTicket).toHaveBeenCalledWith('70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef', 'U');
  });

  it('should throw NotFoundError if charges not found', async () => {
    getPawnTicketCurrentChargesUseCase.execute.mockImplementation(() => Promise.reject(new NotFoundError('Pawn ticket not found')));
    const input = {
      items: [{
        pawnTicketId: '80d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
        controlNumber: '116953',
        createdDate: new Date().toISOString(),
        amountPaid: 50
      }],
      tenders: [{
        id: '1',
        name: 'Cash',
        amount: 50,
        tenderTypeId: 1
      }],
      clerkUserId: '33333333-3333-3333-3333-333333333333'
    };
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
