import { VoidPawnTicketUseCase } from '../../../../../../src/application/use-case/pawnTicket/command/VoidPawnTicketUseCase';
import { NotFoundError, ValidationError } from '../../../../../../src/application/common/errors';

describe('VoidPawnTicketUseCase', () => {
    let mockPawnTicketRepo: any;
    let mockInventoryRepo: any;
    let mockStoreTxRepo: any;
    let mockGunRepo: any;
    let mockUoW: any;
    let useCase: VoidPawnTicketUseCase;

    beforeEach(() => {
        mockPawnTicketRepo = {
            listByControlNumber: jest.fn(),
            setStatus: jest.fn()
        };
        mockInventoryRepo = {
            setStatusByPawnTicket: jest.fn()
        };
        mockStoreTxRepo = {
            create: jest.fn()
        };
        mockGunRepo = {
            create: jest.fn()
        };
        mockUoW = {
            runInTransaction: jest.fn(async (cb) => {
                return cb({
                    pawnTicketRepository: mockPawnTicketRepo,
                    inventoryItemRepository: mockInventoryRepo,
                    storeTransactionRepository: mockStoreTxRepo,
                    gunTransactionHistoryRepository: mockGunRepo
                });
            })
        };

        useCase = new VoidPawnTicketUseCase(mockUoW);
    });

    it('should void a PAWN ticket', async () => {
        const ticket = {
            id: '70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            controlNumber: 'PAWN-1',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            transactionType: 'PAWN',
            amountFinanced: 100,
            pawnStatus: 'P'
        };
        mockPawnTicketRepo.listByControlNumber.mockResolvedValue([ticket]);

        await useCase.execute({
            controlNumber: 'PAWN-1',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            reason: 'Mistake'
        });

        expect(mockPawnTicketRepo.setStatus).toHaveBeenCalledWith('70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef', 'V');
        expect(mockInventoryRepo.setStatusByPawnTicket).toHaveBeenCalledWith('70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef', 'V');
        
        // PAWN -> Void Code should be 9 (PV)
        expect(mockStoreTxRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            typeId: 9,
            amount: 100, // Positive reversal
            tenders: expect.arrayContaining([
                expect.objectContaining({
                    amount: 100,
                    tenderTypeId: 1 // CASH
                })
            ])
        }));
    });

    it('should void a PURCHASE ticket', async () => {
        const ticket = {
            id: '80d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            controlNumber: 'BUY-1',
            customerId: '60e1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            transactionType: 'PURCHASE',
            purchaseTradeValue: 200,
            pawnStatus: 'I'
        };
        mockPawnTicketRepo.listByControlNumber.mockResolvedValue([ticket]);

        await useCase.execute({
            controlNumber: 'BUY-1',
            customerId: '60e1c2e9-2a17-44a4-b59c-ca5ca6d1feef'
        });

        // PURCHASE -> Void Code should be 4 (BV)
        expect(mockStoreTxRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            typeId: 4,
            amount: 200
        }));
    });

    it('should throw NotFound if ticket missing', async () => {
        mockPawnTicketRepo.listByControlNumber.mockResolvedValue([]);
        await expect(useCase.execute({
            controlNumber: 'MISSING',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef'
        })).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if customer mismatch', async () => {
        const ticket = {
            id: '70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            controlNumber: 'PAWN-1',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
        };
        mockPawnTicketRepo.listByControlNumber.mockResolvedValue([ticket]);

        await expect(useCase.execute({
            controlNumber: 'PAWN-1',
            customerId: '60e1c2e9-2a17-44a4-b59c-ca5ca6d1feef' // Mismatch
        })).rejects.toThrow(ValidationError);
    });

    it('should log gun transaction if item is a gun', async () => {
        const ticket = {
            id: '70d1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            controlNumber: 'PAWN-GUN',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            transactionType: 'PAWN',
            amountFinanced: 200,
            pawnStatus: 'P',
            items: [
                { id: 'item-1', inventoryNumber: 'G-12345' },
                { id: 'item-2', inventoryNumber: 'GEN-123' }
            ]
        };
        mockPawnTicketRepo.listByControlNumber.mockResolvedValue([ticket]);

        await useCase.execute({
            controlNumber: 'PAWN-GUN',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef'
        });

        expect(mockGunRepo.create).toHaveBeenCalledTimes(1);
        expect(mockGunRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            inventoryNumber: 'G-12345',
            notes: 'Voided Transaction'
        }));
    });

    it('should use provided tenders if supplied', async () => {
        const ticket = {
            id: 't1',
            controlNumber: '123',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            transactionType: 'PAWN',
            pawnStatus: 'P',
            amountFinanced: 100,
            items: []
        };
        mockPawnTicketRepo.listByControlNumber.mockResolvedValue([ticket]);

        await useCase.execute({
            controlNumber: '123',
            customerId: '50e1c2e9-2a17-44a4-b59c-ca5ca6d1feef',
            tenders: [
                { tenderTypeId: 2, amount: 50 },
                { tenderTypeId: 1, amount: 50 }
            ]
        });

        expect(mockStoreTxRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                tenders: expect.arrayContaining([
                    expect.objectContaining({ tenderTypeId: 2, amount: 50 }),
                    expect.objectContaining({ tenderTypeId: 1, amount: 50 })
                ])
            })
        );
    });
});
