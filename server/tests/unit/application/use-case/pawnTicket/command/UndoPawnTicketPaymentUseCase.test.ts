import { UndoPawnTicketPaymentUseCase } from '../../../../../../src/application/use-case/pawnTicket/command/UndoPawnTicketPaymentUseCase';
import { NotFoundError, ValidationError } from '../../../../../../src/application/common/errors';
import { StoreTransactionTender } from '../../../../../../src/domains/storeTransaction/StoreTransactionTender';

describe('UndoPawnTicketPaymentUseCase', () => {
    let mockPawnTicketPaymentRepo: any;
    let mockStoreTxRepo: any;
    let mockUoW: any;
    let useCase: UndoPawnTicketPaymentUseCase;

    const mockPawnTicketId = '550e8400-e29b-41d4-a716-446655440000';
    const mockCustomerId = '550e8400-e29b-41d4-a716-446655440001';
    const mockClerkUserId = '550e8400-e29b-41d4-a716-446655440002';

    beforeEach(() => {
        mockPawnTicketPaymentRepo = {
            findByPawnTicketId: jest.fn()
        };
        mockStoreTxRepo = {
            createPayment: jest.fn()
        };
        mockUoW = {
            runInTransaction: jest.fn(async (cb) => {
                return cb({
                    storeTransactionRepository: mockStoreTxRepo
                });
            })
        };

        useCase = new UndoPawnTicketPaymentUseCase(mockUoW, mockPawnTicketPaymentRepo);
    });

    it('should successfully undo last payment', async () => {
        // Arrange
        const mockPayment = {
            pawnTicketId: mockPawnTicketId,
            paymentDate: new Date('2023-01-02'),
            principalPaid: 100, // DB amount
            transactionTypeName: 'Payment'
        };
        // Mock returning a list (maybe older ones too)
        mockPawnTicketPaymentRepo.findByPawnTicketId.mockResolvedValue([
            mockPayment,
            { ...mockPayment, paymentDate: new Date('2023-01-01'), principalPaid: 50 }
        ]);

        const input = {
            pawnTicketId: mockPawnTicketId,
            controlNumber: 'PAWN-1',
            customerId: mockCustomerId,
            clerkUserId: mockClerkUserId,
            amount: 100, // Matches last payment
            tenders: [
                { tenderTypeId: 1, amount: 100 }
            ]
        };

        // Act
        await useCase.execute(input);

        // Assert
        expect(mockStoreTxRepo.createPayment).toHaveBeenCalledWith(expect.objectContaining({
            amount: -100, // Negative
            typeId: 7, // Payment
            tenders: expect.arrayContaining([
                expect.objectContaining({
                     amount: -100
                })
            ])
        }));
    });

    it('should throw ValidationError if amount mismatch', async () => {
        mockPawnTicketPaymentRepo.findByPawnTicketId.mockResolvedValue([{
            paymentDate: new Date(),
            principalPaid: 100,
            transactionTypeName: 'Payment'
        }]);

        const input = {
            pawnTicketId: mockPawnTicketId,
            controlNumber: 'PAWN-1',
            customerId: mockCustomerId, 
            clerkUserId: mockClerkUserId,
            amount: 50, // Mismatch
            tenders: [{ tenderTypeId: 1, amount: 50 }]
        };

        await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if tender sum mismatch', async () => {
         mockPawnTicketPaymentRepo.findByPawnTicketId.mockResolvedValue([{
            paymentDate: new Date(),
            principalPaid: 100,
            transactionTypeName: 'Payment'
        }]);

        const input = {
            pawnTicketId: mockPawnTicketId,
            controlNumber: 'PAWN-1',
            customerId: mockCustomerId, 
            clerkUserId: mockClerkUserId,
            amount: 100, 
            tenders: [{ tenderTypeId: 1, amount: 90 }] // Sum mismatch
        };

        await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
});
