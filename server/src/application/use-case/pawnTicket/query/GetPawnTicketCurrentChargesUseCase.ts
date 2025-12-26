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
        const payments = raw
            .filter(p => p && p.paymentDate)
            .map(p => ({ ...p, paymentDate: new Date(p.paymentDate) }))
            .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());

        const increases = payments.filter(p => p.principalPaid < 0);    // negative = increase
        const chargePays = payments.filter(p => p.principalPaid > 0);   // positive = monthly charge payment

        // ---------- 3) initial pawn date and anchor ----------
        // Determine the starting point: use createdDate (if sane), else transactionDate, else first activity
        const created = ticket.createdDate ? new Date(ticket.createdDate) : undefined;
        const createdIsSane = created && created.getUTCFullYear() >= 2000;
        const firstChargePayDate = chargePays.length ? new Date(chargePays[0].paymentDate) : undefined;
        const firstIncreaseDate = increases.length ? new Date(increases[0].paymentDate) : undefined;

        const initialPawnDate =
            (createdIsSane ? created! : firstIncreaseDate) ??
            (ticket.transactionDate ? new Date(ticket.transactionDate) :
                (firstChargePayDate ?? new Date(referenceDate)));

        // ---------- 4) compute due dates and periods ----------
        const daysFromStart = Math.max(0, Math.floor((referenceDate.getTime() - initialPawnDate.getTime()) / dayMs));
        const periodsElapsedToRef = Math.floor(daysFromStart / 30);
        const lastDueDate = addDays(initialPawnDate, 30 * periodsElapsedToRef);
        const daysSinceLastDue = Math.max(0, Math.min(30, Math.floor((referenceDate.getTime() - lastDueDate.getTime()) / dayMs)));

        // ---------- 5) track pawn amount over time and calculate periods paid ----------
        const periodsDueAt = (date: Date) => {
            const elapsedDays = Math.max(0, Math.floor((date.getTime() - initialPawnDate.getTime()) / dayMs));
            const elapsedPeriods = Math.floor(elapsedDays / 30);
            const lastDue = addDays(initialPawnDate, 30 * elapsedPeriods);
            const daysSince = Math.max(0, Math.min(30, Math.floor((date.getTime() - lastDue.getTime()) / dayMs)));
            return elapsedPeriods + (daysSince > 0 ? 1 : 0);
        };

        // Process all payments chronologically to track running pawn amount and periods paid
        // If there are increases, start from 0 and add them; otherwise use amountFinanced
        let runningPawnAmount = increases.length > 0 ? 0 : (typeof ticket.amountFinanced === 'number' ? ticket.amountFinanced : 0);
        let periodsPaid = 0;

        for (const payment of payments) {
            if (payment.paymentDate.getTime() < initialPawnDate.getTime()) continue;
            if (payment.paymentDate.getTime() > referenceDate.getTime()) break;

            if (payment.principalPaid < 0) {
                // Increase: add to pawn amount
                runningPawnAmount += Math.abs(payment.principalPaid);
            } else if (payment.principalPaid > 0) {
                // Charge payment: calculate periods based on current pawn amount
                const monthlyAtPayment = round2(periodicRate * runningPawnAmount);
                if (monthlyAtPayment <= 0) continue;

                const dueSoFar = periodsDueAt(payment.paymentDate);
                const outstanding = Math.max(0, dueSoFar - periodsPaid);
                if (outstanding === 0) continue;

                const paymentPeriods = Math.min(Math.floor(payment.principalPaid / monthlyAtPayment), outstanding);
                periodsPaid += paymentPeriods;
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
        let currentCharges = 0;
        let redemptionAmount = 0;
        const maturityDate = ticket.maturityDate ? new Date(ticket.maturityDate) : undefined;
        const maturityDays = maturityDate ? Math.floor((maturityDate.getTime() - initialPawnDate.getTime()) / dayMs) : undefined;
        if (maturityDays !== undefined && maturityDays <= 60) {
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
                redemptionAmount = round2(pawnAmount + (periodsBehind - 1) * monthly + prorated);
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
