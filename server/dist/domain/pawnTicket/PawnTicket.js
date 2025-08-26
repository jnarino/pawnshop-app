"use strict";
// PawnTicket Domain Model
// Represents either a PAWN (loan secured by pledged property) or a PURCHASE (store buys the item)
// Financial fields & derived calculations follow typical state regulations assumptions:
//  - periodicRate ("finance charge rate") is per 30-day (or actual maturity span) period
//  - periodicRate constrained to [0.10, 0.25] (10% .. 25%) for pawn transactions
//  - financeCharge = amountFinanced * periodicRate (pawn only)
//  - totalOfPayments = amountFinanced + financeCharge (pawn only)
//  - annualPercentageRate (APR) = periodicRate * (365 / termDays) * 100 (pawn only)
//  - maturityDate defaults to transactionDate + 30 days
//  - defaultDate (pawn default / forfeiture point) defaults to transactionDate + 60 days
// For PURCHASE transactions: purchaseTradeValue required; finance-related fields are null.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PAWN_DEFAULT_DAYS = exports.DEFAULT_PAWN_TERM_DAYS = exports.PAWN_DEFAULT_RATE = exports.PAWN_MAX_RATE = exports.PAWN_MIN_RATE = void 0;
exports.computeApr = computeApr;
exports.normalizePawnFinancials = normalizePawnFinancials;
exports.buildPawnTicket = buildPawnTicket;
exports.PAWN_MIN_RATE = 0.10;
exports.PAWN_MAX_RATE = 0.25;
exports.PAWN_DEFAULT_RATE = 0.25; // default highest as provided
exports.DEFAULT_PAWN_TERM_DAYS = 30;
exports.DEFAULT_PAWN_DEFAULT_DAYS = 60;
function addDays(base, days) {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}
// APR formula aligning with provided example (25% over 30 days => 304.17%):
// APR = periodicRate * (365 / termDays) * 100
function computeApr(periodicRate, termDays = exports.DEFAULT_PAWN_TERM_DAYS) {
    return +(periodicRate * (365 / termDays) * 100).toFixed(2);
}
function normalizePawnFinancials(amountFinanced, periodicRate, termDays = exports.DEFAULT_PAWN_TERM_DAYS) {
    let financeCharge = +(amountFinanced * periodicRate).toFixed(2);
    if (financeCharge < 5)
        financeCharge = 5.00; // enforce minimum finance charge
    const totalOfPayments = +(amountFinanced + financeCharge).toFixed(2);
    const annualPercentageRate = computeApr(periodicRate, termDays);
    return { financeCharge, totalOfPayments, annualPercentageRate };
}
function buildPawnTicket(id, input, now = new Date()) {
    if (!input.customerId)
        throw new Error('customerId required');
    if (!Array.isArray(input.inventoryItemIds) || input.inventoryItemIds.length === 0)
        throw new Error('inventoryItemIds required');
    const transactionDate = input.transactionDate ? new Date(input.transactionDate) : now;
    if (isNaN(transactionDate.getTime()))
        throw new Error('invalid transactionDate');
    const maturity = input.maturityDate ? new Date(input.maturityDate) : addDays(transactionDate, exports.DEFAULT_PAWN_TERM_DAYS);
    const defaultDt = input.defaultDate ? new Date(input.defaultDate) : addDays(transactionDate, exports.DEFAULT_PAWN_DEFAULT_DAYS);
    if (maturity < transactionDate)
        throw new Error('maturityDate before transactionDate');
    if (defaultDt < maturity)
        throw new Error('defaultDate before maturityDate');
    let amountFinanced = null;
    let financeCharge = null;
    let periodicRate = null;
    let totalOfPayments = null;
    let annualPercentageRate = null;
    let purchaseTradeValue = null;
    if (input.type === 'PAWN') {
        if (typeof input.amountFinanced !== 'number' || input.amountFinanced <= 0)
            throw new Error('amountFinanced required & > 0 for PAWN');
        amountFinanced = +input.amountFinanced.toFixed(2);
        periodicRate = input.periodicRate ?? exports.PAWN_DEFAULT_RATE;
        if (periodicRate < exports.PAWN_MIN_RATE || periodicRate > exports.PAWN_MAX_RATE)
            throw new Error('periodicRate out of range');
        const termDays = Math.ceil((maturity.getTime() - transactionDate.getTime()) / 86400000);
        const fin = normalizePawnFinancials(amountFinanced, periodicRate, termDays);
        financeCharge = fin.financeCharge;
        totalOfPayments = fin.totalOfPayments;
        annualPercentageRate = fin.annualPercentageRate;
    }
    else { // PURCHASE
        if (typeof input.purchaseTradeValue !== 'number' || input.purchaseTradeValue <= 0)
            throw new Error('purchaseTradeValue required & > 0 for PURCHASE');
        purchaseTradeValue = +input.purchaseTradeValue.toFixed(2);
    }
    const iso = (d) => d.toISOString();
    return {
        id,
        controlNumber: input.controlNumber,
        type: input.type,
        customerId: input.customerId,
        pawnStatus: 'active',
        inventoryItemIds: input.inventoryItemIds,
        amountFinanced,
        financeCharge,
        periodicRate,
        totalOfPayments,
        annualPercentageRate,
        purchaseTradeValue,
        transactionDate: iso(transactionDate),
        maturityDate: iso(maturity),
        defaultDate: iso(defaultDt),
        createdAt: iso(now),
        updatedAt: iso(now),
    };
}
