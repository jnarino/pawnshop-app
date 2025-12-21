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

        // ---------- 3) current pawn amount & initial pawn date ----------
        // pawnAmount: if increases exist, it's the sum of absolute negatives; else use amountFinanced.
        const pawnAmount = increases.length > 0
            ? increases.reduce((sum, p) => sum + Math.abs(p.principalPaid), 0)
            : (typeof ticket.amountFinanced === 'number' ? ticket.amountFinanced : 0);

        // initial anchor: first increase date; else createdDate (if sane); else transactionDate; else first activity; else today
        const firstIncreaseDate = increases.length ? new Date(increases[0].paymentDate) : undefined;
        const created = ticket.createdDate ? new Date(ticket.createdDate) : undefined;
        const createdIsSane = created && created.getUTCFullYear() >= 2000;
        const firstChargePayDate = chargePays.length ? new Date(chargePays[0].paymentDate) : undefined;

        const initialPawnDate =
            firstIncreaseDate ??
            (createdIsSane ? created! :
                (ticket.transactionDate ? new Date(ticket.transactionDate) :
                    (firstChargePayDate ?? new Date(referenceDate))));

        // ---------- 4) compute due dates and periods ----------
        // Due dates: initial + 30, +60, ...
        const daysFromStart = Math.max(0, Math.floor((referenceDate.getTime() - initialPawnDate.getTime()) / dayMs));
        const periodsElapsedToRef = Math.floor(daysFromStart / 30);  // full 30d periods completed by reference
        const lastDueDate = addDays(initialPawnDate, 30 * periodsElapsedToRef);
        const daysSinceLastDue = Math.max(0, Math.min(30, Math.floor((referenceDate.getTime() - lastDueDate.getTime()) / dayMs)));

        // ---------- 5) periodsBehind = periods up to next due − number of payments done ----------
        // Count payments up to referenceDate (we treat each positive row as satisfying one period).
        const paymentsCount = chargePays.filter(p => p.paymentDate.getTime() <= referenceDate.getTime()).length;

        // Total periods with dueDate <= lastDueDate are (periodsElapsedToRef + 1 if daysSinceLastDue > 0, else periodsElapsedToRef)
        const totalPeriodsUpToRef = periodsElapsedToRef + (daysSinceLastDue > 0 ? 1 : 0);
        let periodsBehind = Math.max(0, totalPeriodsUpToRef - paymentsCount);
        // Always charge at least 1 period if any days have elapsed and not fully paid
        if (periodsBehind === 0 && daysFromStart > 0 && paymentsCount === 0) {
            periodsBehind = 1;
        }

        // ---------- 6) current charges & redemption ----------
        const monthly = round2(periodicRate * pawnAmount);
        const daily = monthly / 30;

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
