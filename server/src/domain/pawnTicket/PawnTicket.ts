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

export type PawnTicketType = 'PAWN' | 'PURCHASE';
export type PawnStatus = 'active' | 'defaulted' | 'police hold' | 'confiscation';


export interface PawnTicket {
  id: string;
  controlNumber?: string;            // human-readable control / form number
  type: PawnTicketType;
  customerId: string;
  pawnStatus: PawnStatus;
  inventoryItemIds: string[];        // pledged or purchased items

  // Core financials (pawn only)
  amountFinanced: number | null;     // principal loan amount (pawn)
  financeCharge: number | null;      // dollar finance charge for the term
  periodicRate: number | null;       // decimal (e.g., 0.25 for 25% period rate)
  totalOfPayments: number | null;    // redemption amount = principal + finance charge
  annualPercentageRate: number | null; // APR percentage (e.g., 304.17)

  // Purchase / trade (purchase only)
  purchaseTradeValue: number | null; // amount paid to seller for purchase/trade

  transactionDate: string;           // ISO timestamp
  maturityDate: string;              // ISO date/time (end of 30-day period unless overridden)
  defaultDate: string;               // ISO date/time (e.g., 60 days from transaction)

  createdAt: string;
  updatedAt: string;
}

export interface CreatePawnTicketInput {
  controlNumber?: string;
  type: PawnTicketType;
  customerId: string;
  inventoryItemIds: string[];
  // Pawn-specific inputs
  amountFinanced?: number;          // required if type === 'PAWN'
  periodicRate?: number;            // optional (defaults 0.25 if pawn)
  // Purchase-specific input
  purchaseTradeValue?: number;      // required if type === 'PURCHASE'
  // Optional overrides
  transactionDate?: string;         // default now
  maturityDate?: string;            // default +30 days
  defaultDate?: string;             // default +60 days
}

export const PAWN_MIN_RATE = 0.10;
export const PAWN_MAX_RATE = 0.25;
export const PAWN_DEFAULT_RATE = 0.25; // default highest as provided
export const DEFAULT_PAWN_TERM_DAYS = 30;
export const DEFAULT_PAWN_DEFAULT_DAYS = 60;

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// APR formula aligning with provided example (25% over 30 days => 304.17%):
// APR = periodicRate * (365 / termDays) * 100
export function computeApr(periodicRate: number, termDays = DEFAULT_PAWN_TERM_DAYS): number {
  return +(periodicRate * (365 / termDays) * 100).toFixed(2);
}

export function normalizePawnFinancials(amountFinanced: number, periodicRate: number, termDays = DEFAULT_PAWN_TERM_DAYS) {
  let financeCharge = +(amountFinanced * periodicRate).toFixed(2);
  if (financeCharge < 5) financeCharge = 5.00; // enforce minimum finance charge
  const totalOfPayments = +(amountFinanced + financeCharge).toFixed(2);
  const annualPercentageRate = computeApr(periodicRate, termDays);
  return { financeCharge, totalOfPayments, annualPercentageRate };
}

export function buildPawnTicket(id: string, input: CreatePawnTicketInput, now = new Date()): PawnTicket {
  if (!input.customerId) throw new Error('customerId required');
  if (!Array.isArray(input.inventoryItemIds) || input.inventoryItemIds.length === 0) throw new Error('inventoryItemIds required');
  const transactionDate = input.transactionDate ? new Date(input.transactionDate) : now;
  if (isNaN(transactionDate.getTime())) throw new Error('invalid transactionDate');

  const maturity = input.maturityDate ? new Date(input.maturityDate) : addDays(transactionDate, DEFAULT_PAWN_TERM_DAYS);
  const defaultDt = input.defaultDate ? new Date(input.defaultDate) : addDays(transactionDate, DEFAULT_PAWN_DEFAULT_DAYS);
  if (maturity < transactionDate) throw new Error('maturityDate before transactionDate');
  if (defaultDt < maturity) throw new Error('defaultDate before maturityDate');

  let amountFinanced: number | null = null;
  let financeCharge: number | null = null;
  let periodicRate: number | null = null;
  let totalOfPayments: number | null = null;
  let annualPercentageRate: number | null = null;
  let purchaseTradeValue: number | null = null;

  if (input.type === 'PAWN') {
    if (typeof input.amountFinanced !== 'number' || input.amountFinanced <= 0) throw new Error('amountFinanced required & > 0 for PAWN');
    amountFinanced = +input.amountFinanced.toFixed(2);
    periodicRate = input.periodicRate ?? PAWN_DEFAULT_RATE;
    if (periodicRate < PAWN_MIN_RATE || periodicRate > PAWN_MAX_RATE) throw new Error('periodicRate out of range');
    const termDays = Math.ceil((maturity.getTime() - transactionDate.getTime()) / 86400000);
    const fin = normalizePawnFinancials(amountFinanced, periodicRate, termDays);
    financeCharge = fin.financeCharge;
    totalOfPayments = fin.totalOfPayments;
    annualPercentageRate = fin.annualPercentageRate;
  } else { // PURCHASE
    if (typeof input.purchaseTradeValue !== 'number' || input.purchaseTradeValue <= 0) throw new Error('purchaseTradeValue required & > 0 for PURCHASE');
    purchaseTradeValue = +input.purchaseTradeValue.toFixed(2);
  }

  const iso = (d: Date) => d.toISOString();
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
