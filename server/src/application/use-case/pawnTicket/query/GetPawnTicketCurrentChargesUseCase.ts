import { ListPawnTicketsByControlNumberUseCase } from './ListPawnTicketsByControlNumberUseCase';
import { GetPawnTicketPaymentsUseCase } from '../../pawnTicketPayment/query/GetPawnTicketPaymentsUseCase';
import { PawnTicketCurrentChargesResponseDto } from '../../../dto/pawnTicket/query/PawnTicketCurrentChargesResponseDto';

export class GetPawnTicketCurrentChargesUseCase {
    constructor(
        private readonly listByControlNumberUseCase: ListPawnTicketsByControlNumberUseCase,
        private readonly getPawnTicketPaymentsUseCase: GetPawnTicketPaymentsUseCase
    ) { }

    async execute(input: { controlNumber: string; referenceDate?: Date }): Promise<PawnTicketCurrentChargesResponseDto> {
        // ---------- helpers ----------
        const dayMs = 24 * 60 * 60 * 1000;
        const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
        const addDays = (d: Date, n: number) =>
            new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + n * dayMs);

        // ---------- 1) ticket ----------
        const [ticket] = await this.listByControlNumberUseCase.execute({ controlNumber: input.controlNumber });
        if (!ticket) throw new Error('Pawn ticket not found');

        const referenceDate = input.referenceDate ? new Date(input.referenceDate) : new Date();
        const periodicRate =
            typeof ticket.periodicRate === 'number' && ticket.periodicRate > 0 ? ticket.periodicRate : 0.25;

        // ---------- 2) payments (asc) ----------
        const raw = await this.getPawnTicketPaymentsUseCase.execute({ pawnTicketId: ticket.id });

        // Sort payments chronologically first
        const sortedPayments = raw
            .filter(p => p && p.paymentDate)
            .map(p => ({
                paymentDate: new Date(p.paymentDate),
                principalPaid: p.principalPaid,
                transactionTypeName: p.transactionTypeName || ''
            }))
            .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());

        // Separate increases (negative amounts that are actual pawn transactions, not payment voids)
        // from regular payments
        const isPawnIncrease = (p: typeof sortedPayments[0]) => {
            return p.principalPaid < 0 && 
                   (p.transactionTypeName === 'PAWN (loan cash out)' || 
                    p.transactionTypeName === 'PAWN DEFAULTED (status)');
        };
        
        const increases = sortedPayments.filter(isPawnIncrease);
        const chargePays = sortedPayments.filter(p => !isPawnIncrease(p));

        // For charge payments (including voids), aggregate by day to handle voids
        const chargePaymentsByDay = new Map<string, { paymentDate: Date; principalPaid: number; transactionTypeName: string }>();
        for (const p of chargePays) {
            const key = p.paymentDate.toISOString().slice(0, 10);
            const existing = chargePaymentsByDay.get(key);
            if (existing) {
                existing.principalPaid += p.principalPaid;
            } else {
                chargePaymentsByDay.set(key, { ...p });
            }
        }

        const aggregatedChargePays = Array.from(chargePaymentsByDay.values())
            .filter(p => p.principalPaid !== 0);

        // Combine increases and aggregated charge payments, then sort
        const payments = [...increases, ...aggregatedChargePays]
            .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());

        // ---------- 3) initial pawn date and anchor ----------
        // Determine the starting point for charge calculations
        // Use the ORIGINAL pawn date for calculating total periods owed
        // Re-pawn is only used to determine current pawn amount
        const created = ticket.createdDate ? new Date(ticket.createdDate) : undefined;
        const createdIsSane = created && created.getUTCFullYear() >= 2000;
        
        // Find the last re-pawn (PAWN DEFAULTED with negative amount)
        const lastRepawn = increases
            .filter(p => p.transactionTypeName === 'PAWN DEFAULTED (status)')
            .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
        
        const firstChargePayDate = chargePays.length ? new Date(chargePays[0].paymentDate) : undefined;
        const firstIncreaseDate = increases.length ? new Date(increases[0].paymentDate) : undefined;

        // Use createdDate for initial pawn date (not re-pawn date)
        const initialPawnDate = (createdIsSane ? created! : firstIncreaseDate) ??
              (ticket.transactionDate ? new Date(ticket.transactionDate) :
                (firstChargePayDate ?? new Date(referenceDate)));

        // ---------- 4) compute due dates and periods ----------
        // Normalize to UTC midnight for consistent day counting
        const initialPawnDateNorm = new Date(Date.UTC(
            initialPawnDate.getUTCFullYear(),
            initialPawnDate.getUTCMonth(),
            initialPawnDate.getUTCDate()
        ));
        const referenceDateNorm = new Date(Date.UTC(
            referenceDate.getUTCFullYear(),
            referenceDate.getUTCMonth(),
            referenceDate.getUTCDate()
        ));
        
        const daysFromStart = Math.max(0, Math.floor((referenceDateNorm.getTime() - initialPawnDateNorm.getTime()) / dayMs));
        const periodsElapsedToRef = Math.floor(daysFromStart / 30);
        const lastDueDate = addDays(initialPawnDateNorm, 30 * periodsElapsedToRef);
        const daysSinceLastDue = Math.max(0, Math.min(30, Math.floor((referenceDateNorm.getTime() - lastDueDate.getTime()) / dayMs)));

        // ---------- 5) track pawn amount over time and calculate periods paid ----------
        const periodsDueAt = (date: Date) => {
            // Normalize payment date to midnight UTC for consistent day counting
            const dateNorm = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
            const elapsedDays = Math.max(0, Math.floor((dateNorm.getTime() - initialPawnDateNorm.getTime()) / dayMs));
            const elapsedPeriods = Math.floor(elapsedDays / 30);
            const lastDue = addDays(initialPawnDateNorm, 30 * elapsedPeriods);
            const daysSince = Math.max(0, Math.min(30, Math.floor((dateNorm.getTime() - lastDue.getTime()) / dayMs)));
            return elapsedPeriods + (daysSince > 0 ? 1 : 0);
        };

        // Process all payments chronologically to track running pawn amount and periods paid
        // If there's a re-pawn, only consider the last increase (re-pawn amount)
        // Otherwise if there are increases, start from 0 and add them; otherwise use amountFinanced
        
        // Check if we have any history transactions (increases or re-pawns)
        const hasHistory = payments.some(p => p.principalPaid < 0);
        
        // Initialize running pawn amount
        // If we have history, start at 0 and let the transaction log build it up
        // If no history found (legacy), start with amountFinanced
        let runningPawnAmount = hasHistory ? 0 : (typeof ticket.amountFinanced === 'number' ? ticket.amountFinanced : 0);
        let periodsPaid = 0;

        for (const payment of payments) {
            // Skip payments before initialPawnDate
            if (payment.paymentDate.getTime() < initialPawnDate.getTime()) {
                continue;
            }
            
            // Include payments on or before the reference date
            // Compare dates only (not time) to include all payments made on the reference date
            const paymentDay = new Date(payment.paymentDate.toISOString().slice(0, 10));
            const referenceDay = new Date(referenceDate.toISOString().slice(0, 10));
            if (paymentDay.getTime() > referenceDay.getTime()) break;

            // Handle Increases and Re-pawns (Negative Principal)
            if (payment.principalPaid < 0) {
                if (payment.transactionTypeName === 'PAWN DEFAULTED (status)') {
                    // Re-pawn: This resets/sets the principal amount (e.g. recovery re-pawn)
                    runningPawnAmount = Math.abs(payment.principalPaid);
                } else {
                    // Regular Increase (loan cash out): Add to principal
                    runningPawnAmount += Math.abs(payment.principalPaid);
                }
                continue;
            }

            // Skip recovery payments (positive PAWN DEFAULTED payments - these are paying off the old pawn, not the new one)
            if (payment.transactionTypeName === 'PAWN DEFAULTED (status)' && payment.principalPaid > 0) {
                continue;
            }

            // Process charge payments
            if (payment.principalPaid > 0) {
                // Charge payment: calculate periods based on current pawn amount
                const monthlyAtPayment = round2(periodicRate * runningPawnAmount);
                if (monthlyAtPayment <= 0) continue;

                const dueSoFar = periodsDueAt(payment.paymentDate);
                const outstanding = Math.max(0, dueSoFar - periodsPaid);
                if (outstanding === 0) continue;

                // Handle partial payments strictly? No, floor it.
                // But ensure we don't divide by zero if runningPawnAmount is somehow 0
                if (monthlyAtPayment > 0) {
                    const paymentPeriods = Math.min(Math.floor(payment.principalPaid / monthlyAtPayment), outstanding);
                    periodsPaid += paymentPeriods;
                }
            }
        }

        // Final pawn amount and monthly charge for current calculations
        const pawnAmount = runningPawnAmount;
        const monthly = round2(periodicRate * pawnAmount);
        const daily = monthly / 30;

        // ---------- 6) calculate periods behind ----------
        const totalPeriodsUpToRef = periodsDueAt(referenceDate);
        let periodsBehind = Math.max(0, totalPeriodsUpToRef - periodsPaid);
        // Always charge at least 1 period if any days have elapsed and not fully paid
        if (periodsBehind === 0 && daysFromStart > 0 && periodsPaid === 0) {
            periodsBehind = 1;
        }

        // ---------- 7) current charges & redemption ----------

        // Special rule: if maturity is <= 60 days from initialPawnDate, always charge full period(s)
        // BUT: this early window logic does NOT apply if there's been a re-pawn
        let currentCharges = 0;
        let redemptionAmount = 0;
        const maturityDate = ticket.maturityDate ? new Date(ticket.maturityDate) : undefined;
        const maturityDateNorm = maturityDate ? new Date(Date.UTC(
            maturityDate.getUTCFullYear(),
            maturityDate.getUTCMonth(),
            maturityDate.getUTCDate()
        )) : undefined;
        const maturityDays = maturityDateNorm ? Math.floor((maturityDateNorm.getTime() - initialPawnDateNorm.getTime()) / dayMs) : undefined;
        const withinEarlyWindow = !lastRepawn && maturityDays !== undefined && maturityDays <= 60 && !!maturityDateNorm && maturityDateNorm.getTime() >= referenceDateNorm.getTime();
        if (withinEarlyWindow) {
            // If <= 30 days, charge 1 full period; if >30 and <=60, charge 2 full periods ONLY if more than 30 days have elapsed
            let forcedPeriods = 1;
            if (maturityDays > 30 && daysFromStart > 30) {
                forcedPeriods = 2;
            }
            currentCharges = round2(forcedPeriods * monthly);
            redemptionAmount = round2(pawnAmount + currentCharges);
        } else {
            currentCharges = round2(periodsBehind * monthly);
            if (periodsBehind > 0) {
                const prorated = round2(daily * daysSinceLastDue);

                // Redemption Logic:
                // See docs/PAWN_REDEMPTION_LOGIC.md for detailed explanation.
                // Fixes discrepancy where exact 30-day boundaries resulted in lower redemption than current charges.
                
                if (daysSinceLastDue === 0 && periodsBehind > 0) {
                     redemptionAmount = round2(pawnAmount + periodsBehind * monthly);
                } else {
                    redemptionAmount = round2(pawnAmount + (periodsBehind - 1) * monthly + prorated);
                }
            } else {
                redemptionAmount = round2(pawnAmount);
            }
        }

        return {
            pawnTicketId: ticket.id,
            currentCharges,
            pawnAmount,
            periodsBehind,
            redemptionAmount
        };
    }
}
