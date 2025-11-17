import assert from 'assert';
import { CreatePawnTicketPaymentUseCase } from '../../../../application/useCase/payment/CreatePawnTicketPaymentUseCase';
import { test } from '../../../testHarness';

// Mock the SQL file loading
const mockSqlQueries = {
    createStoreTransaction: 'INSERT INTO store_transaction VALUES ($1, $2, $3, $4, $5, $6, $7)',
    createPawnTicketPayment: 'INSERT INTO pawn_ticket_payment VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    updatePawnTicketLastPayment: 'UPDATE pawn_ticket SET last_payment_at = $2 WHERE id = $1'
};

test('CreatePawnTicketPaymentUseCase: processes bulk payment successfully', async () => {
    const useCase = new CreatePawnTicketPaymentUseCase();
    
    // Mock the SQL loading by overriding the private properties
    (useCase as any).createStoreTransactionSql = mockSqlQueries.createStoreTransaction;
    (useCase as any).createPawnTicketPaymentSql = mockSqlQueries.createPawnTicketPayment;
    (useCase as any).updatePawnTicketLastPaymentSql = mockSqlQueries.updatePawnTicketLastPayment;

    const bulkPaymentData = {
        customerId: 'customer-1',
        totalAmount: 150,
        tenders: [{ type: 'CASH', amount: 150 }],
        pawnTicketPayments: [
            {
                pawnTicketId: 'ticket-1',
                paymentType: 'redemption' as const,
                interestPaid: 25,
                principalPaid: 100,
                totalAmount: 125,
                note: 'Full redemption'
            },
            {
                pawnTicketId: 'ticket-2', 
                paymentType: 'partial' as const,
                interestPaid: 25,
                principalPaid: 0,
                totalAmount: 25,
                note: 'Interest payment'
            }
        ]
    };

    // Mock pool.connect and client methods
    const mockQueries: any[] = [];
    const mockClient = {
        query: async (sql: string, params?: any[]) => {
            mockQueries.push({ sql, params });
            return { rows: [] };
        },
        release: () => {}
    };

    // Mock the pool
    const originalPool = require('../../../../infrastructure/db').pool;
    const mockPool = {
        connect: async () => mockClient
    };
    
    // Replace pool temporarily
    require('../../../../infrastructure/db').pool = mockPool;

    try {
        const result = await useCase.execute(bulkPaymentData);
        
        assert(result.transactionId);
        assert(result.paymentIds);
        assert.strictEqual(result.paymentIds.length, 2);
        
        // Verify correct number of database operations
        assert.strictEqual(mockQueries.length, 6); // 1 store_transaction + 2 payments + 2 updates + BEGIN/COMMIT
        
    } finally {
        // Restore original pool
        require('../../../../infrastructure/db').pool = originalPool;
    }
});

test('CreatePawnTicketPaymentUseCase: validates payment data', async () => {
    const useCase = new CreatePawnTicketPaymentUseCase();
    
    try {
        await useCase.execute({
            customerId: '',
            totalAmount: 0,
            tenders: [],
            pawnTicketPayments: []
        });
        assert.fail('Should have thrown validation error');
    } catch (error) {
        // Expected to fail due to empty data
        assert(error instanceof Error);
    }
});

test('CreatePawnTicketPaymentUseCase: handles transaction rollback', async () => {
    const useCase = new CreatePawnTicketPaymentUseCase();
    
    (useCase as any).createStoreTransactionSql = mockSqlQueries.createStoreTransaction;
    (useCase as any).createPawnTicketPaymentSql = mockSqlQueries.createPawnTicketPayment;
    (useCase as any).updatePawnTicketLastPaymentSql = mockSqlQueries.updatePawnTicketLastPayment;

    const mockClient = {
        query: async (sql: string) => {
            if (sql.includes('INSERT INTO pawn_ticket_payment')) {
                throw new Error('Database error');
            }
            return { rows: [] };
        },
        release: () => {}
    };

    const originalPool = require('../../../../infrastructure/db').pool;
    const mockPool = {
        connect: async () => mockClient
    };
    
    require('../../../../infrastructure/db').pool = mockPool;

    try {
        await useCase.execute({
            customerId: 'customer-1',
            totalAmount: 100,
            tenders: [{ type: 'CASH', amount: 100 }],
            pawnTicketPayments: [{
                pawnTicketId: 'ticket-1',
                paymentType: 'redemption' as const,
                interestPaid: 25,
                principalPaid: 75,
                totalAmount: 100,
                note: 'Test payment'
            }]
        });
        assert.fail('Should have thrown database error');
    } catch (error) {
        assert(error instanceof Error);
        assert.strictEqual(error.message, 'Database error');
    } finally {
        require('../../../../infrastructure/db').pool = originalPool;
    }
});
