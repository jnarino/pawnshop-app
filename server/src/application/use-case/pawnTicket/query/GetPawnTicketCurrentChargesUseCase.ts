import { ListPawnTicketsByControlNumberUseCase } from './ListPawnTicketsByControlNumberUseCase';
import { GetPawnTicketPaymentsUseCase } from '../../pawnTicketPayment/query/GetPawnTicketPaymentsUseCase';
import { PawnTicketCurrentChargesResponseDto } from '../../../dto/pawnTicket/query/PawnTicketCurrentChargesResponseDto';

export class GetPawnTicketCurrentChargesUseCase {
    constructor(
        private readonly listByControlNumberUseCase: ListPawnTicketsByControlNumberUseCase,
        private readonly getPawnTicketPaymentsUseCase: GetPawnTicketPaymentsUseCase
    ) { }

    async execute(input: { controlNumber: string }): Promise<PawnTicketCurrentChargesResponseDto> {
        // 1. Get ticket by control number
        const tickets = await this.listByControlNumberUseCase.execute({ controlNumber: input.controlNumber });
        if (!tickets || tickets.length === 0) throw new Error('Pawn ticket not found');
        const ticket = tickets[0];

        console.log('Calculating charges for ticket:', ticket);
        // 2. Get payments
        const payments = await this.getPawnTicketPaymentsUseCase.execute({ pawnTicketId: ticket.id });

        console.log('Payments retrieved:', payments);

        // 3. Calculate increases and periods
        let pawnAmount = 0;
        let interest = 0;
        let increases: { date: Date, amount: number }[] = [];
        let baseAmount = ticket.amountFinanced || 0;
        let baseInterest = ticket.financeCharge || 0;
        let lastIncreaseDate = new Date(ticket.transactionDate);
        pawnAmount = baseAmount;
        interest = baseInterest;
        for (const p of payments) {
            if (p.principalPaid < 0) {
                pawnAmount += Math.abs(p.principalPaid);
                interest = pawnAmount * (ticket.periodicRate || 0);
                lastIncreaseDate = new Date(p.paymentDate);
                increases.push({ date: lastIncreaseDate, amount: Math.abs(p.principalPaid) });
            }
        }
        // Calculate periods
        const now = new Date();
        const msInDay = 24 * 60 * 60 * 1000;
        const daysElapsed = Math.floor((now.getTime() - lastIncreaseDate.getTime()) / msInDay);
        const periodLength = 30;
        const periodsElapsed = Math.floor(daysElapsed / periodLength) + 1;
        const paymentsMade = payments.filter(p => p.principalPaid > 0).length;
        let periodsBehind = Math.max(0, periodsElapsed - paymentsMade);
        let currentCharges = 0;
        let redemptionAmount = 0;
        if (daysElapsed <= 60) {
            currentCharges = interest * periodsBehind;
        } else {
            const dailyInterest = interest / 30;
            const extraDays = daysElapsed - (periodLength * (periodsElapsed - 1));
            currentCharges = interest * periodsBehind + (extraDays > 0 ? extraDays * dailyInterest : 0);
        }
        redemptionAmount = pawnAmount + (interest * periodsElapsed) - payments.reduce((sum, p) => sum + (p.principalPaid || 0), 0);
        return {
            pawnTicketId: ticket.id,
            currentCharges,
            pawnAmount,
            periodsBehind,
            redemptionAmount
        };
    }
}
