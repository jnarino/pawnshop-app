import assert from 'assert';
import { 
    buildPawnTicket, 
    computeApr, 
    normalizePawnFinancials,
    PAWN_MIN_RATE,
    PAWN_MAX_RATE,
    type CreatePawnTicketInput 
} from '../../../domain/pawnTicket/PawnTicket';
import { test } from '../../testHarness';

test('buildPawnTicket: creates valid pawn ticket', () => {
    const input: CreatePawnTicketInput = {
        type: 'PAWN',
        customerId: 'customer-1',
        amountFinanced: 100,
        periodicRate: 0.25,
        inventoryItemIds: ['item-1']
    };

    const ticket = buildPawnTicket('ticket-1', input);

    assert.strictEqual(ticket.id, 'ticket-1');
    assert.strictEqual(ticket.type, 'PAWN');
    assert.strictEqual(ticket.customerId, 'customer-1');
    assert.strictEqual(ticket.amountFinanced, 100);
    assert.strictEqual(ticket.periodicRate, 0.25);
    assert.strictEqual(ticket.financeCharge, 25); // 100 * 0.25
    assert.strictEqual(ticket.totalOfPayments, 125); // 100 + 25
    assert.strictEqual(ticket.pawnStatus, 'active');
});

test('buildPawnTicket: creates valid purchase ticket', () => {
    const input: CreatePawnTicketInput = {
        type: 'PURCHASE',
        customerId: 'customer-1',
        purchaseTradeValue: 200,
        inventoryItemIds: ['item-1']
    };

    const ticket = buildPawnTicket('ticket-1', input);

    assert.strictEqual(ticket.type, 'PURCHASE');
    assert.strictEqual(ticket.purchaseTradeValue, 200);
    assert.strictEqual(ticket.amountFinanced, null);
    assert.strictEqual(ticket.financeCharge, null);
    assert.strictEqual(ticket.periodicRate, null);
});

test('buildPawnTicket: enforces minimum finance charge', () => {
    const input: CreatePawnTicketInput = {
        type: 'PAWN',
        customerId: 'customer-1',
        amountFinanced: 10, // Small amount
        periodicRate: 0.10, // 10% = $1 finance charge
        inventoryItemIds: ['item-1']
    };

    const ticket = buildPawnTicket('ticket-1', input);

    assert.strictEqual(ticket.financeCharge, 5.00); // Minimum $5.00
    assert.strictEqual(ticket.totalOfPayments, 15.00); // 10 + 5
});

test('buildPawnTicket: validates rate limits', () => {
    const inputTooLow: CreatePawnTicketInput = {
        type: 'PAWN',
        customerId: 'customer-1',
        amountFinanced: 100,
        periodicRate: 0.05, // Below minimum
        inventoryItemIds: ['item-1']
    };

    assert.throws(() => buildPawnTicket('ticket-1', inputTooLow), /periodicRate out of range/);

    const inputTooHigh: CreatePawnTicketInput = {
        type: 'PAWN',
        customerId: 'customer-1',
        amountFinanced: 100,
        periodicRate: 0.30, // Above maximum
        inventoryItemIds: ['item-1']
    };

    assert.throws(() => buildPawnTicket('ticket-1', inputTooHigh), /periodicRate out of range/);
});

test('buildPawnTicket: validates required fields', () => {
    // Missing customerId
    assert.throws(() => buildPawnTicket('ticket-1', { type: 'PAWN' } as any), /customerId required/);

    // Missing inventory items
    assert.throws(() => buildPawnTicket('ticket-1', {
        type: 'PAWN',
        customerId: 'customer-1',
        amountFinanced: 100
    } as any), /Either inventoryItemIds or newInventoryItems required/);

    // Pawn missing amountFinanced
    assert.throws(() => buildPawnTicket('ticket-1', {
        type: 'PAWN',
        customerId: 'customer-1',
        inventoryItemIds: ['item-1']
    } as any), /amountFinanced required/);

    // Purchase missing purchaseTradeValue
    assert.throws(() => buildPawnTicket('ticket-1', {
        type: 'PURCHASE',
        customerId: 'customer-1',
        inventoryItemIds: ['item-1']
    } as any), /purchaseTradeValue required/);
});

test('computeApr: calculates correct APR', () => {
    // 25% over 30 days should be ~304.17% APR
    const apr = computeApr(0.25, 30);
    assert.strictEqual(apr, 304.17);

    // 20% over 60 days should be ~121.67% APR
    const apr60 = computeApr(0.20, 60);
    assert.strictEqual(apr60, 121.67);
});

test('normalizePawnFinancials: enforces minimum finance charge', () => {
    const result = normalizePawnFinancials(10, 0.10); // $10 * 10% = $1, but min is $5
    
    assert.strictEqual(result.financeCharge, 5.00);
    assert.strictEqual(result.totalOfPayments, 15.00);
    assert.strictEqual(result.annualPercentageRate, 121.67); // 10% over 30 days
});

test('normalizePawnFinancials: handles normal calculations', () => {
    const result = normalizePawnFinancials(100, 0.25);
    
    assert.strictEqual(result.financeCharge, 25.00);
    assert.strictEqual(result.totalOfPayments, 125.00);
    assert.strictEqual(result.annualPercentageRate, 304.17);
});
