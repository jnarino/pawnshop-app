import React, { useState, useEffect } from 'react';
import './ServiceChargeModal.css';

interface Props {
    open: boolean;
    ticketNumber: string;
    pawnTicket?: any;
    onCancel: () => void;
    onDone: (amount: number) => void;
}

export default function ServiceChargeModal({ open, ticketNumber, pawnTicket, onCancel, onDone }: Props) {
    const [serviceCharge, setServiceCharge] = useState('0.00');
    const [partialPayment, setPartialPayment] = useState('0.00');
    const [future, setFuture] = useState('0');
    const [principalLower, setPrincipalLower] = useState('0.00');
    const [redemption, setRedemption] = useState('0.00');
    const [lateCharge, setLateCharge] = useState('0.00');
    const [lostTicket, setLostTicket] = useState('0.00');
    const [totalPaid, setTotalPaid] = useState('0.00');
    const [amountLeft, setAmountLeft] = useState('0.00');
    const [selectedPeriod, setSelectedPeriod] = useState(2);

    // Calculate actual dates from pawn ticket data
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            // ✅ Check if date is valid before formatting
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    // ✅ Safe date creation helper
    const createSafeDate = (dateStr?: string): Date | null => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        } catch {
            return null;
        }
    };

    // Calculate service charge periods based on pawn ticket
    const calculateServicePeriods = () => {
        if (!pawnTicket) return [];

        // ✅ Use safe date creation
        const transactionDate = createSafeDate(pawnTicket.transactionDate || pawnTicket.transaction_date);
        const maturityDate = createSafeDate(pawnTicket.maturityDate || pawnTicket.maturity_date);

        // ✅ Return empty array if dates are invalid
        if (!transactionDate || !maturityDate) {
            console.warn('[ServiceChargeModal] Invalid dates in pawn ticket:', {
                transactionDate: pawnTicket.transactionDate || pawnTicket.transaction_date,
                maturityDate: pawnTicket.maturityDate || pawnTicket.maturity_date
            });
            return [];
        }

        // Calculate base service charge (finance charge from pawn ticket)
        const baseServiceCharge = parseFloat(pawnTicket.financeCharge || pawnTicket.finance_charge || '0');

        // Calculate periods
        const periods = [];

        // Current period (what's due now)
        periods.push({
            period: 'CURRENT',
            date: formatDate(pawnTicket.maturityDate || pawnTicket.maturity_date),
            amount: baseServiceCharge
        });

        // Next period (30 days from maturity)
        const nextPeriodDate = new Date(maturityDate.getTime());
        nextPeriodDate.setDate(nextPeriodDate.getDate() + 30);
        
        // ✅ Use safe date formatting instead of toISOString()
        periods.push({
            period: '2',
            date: formatDate(nextPeriodDate.toISOString()),
            amount: baseServiceCharge
        });

        return periods;
    };

    // ✅ Wrap in try-catch for additional safety
    const getServicePeriods = () => {
        try {
            return calculateServicePeriods();
        } catch (error) {
            console.error('[ServiceChargeModal] Error calculating service periods:', error);
            return [];
        }
    };

    const servicePeriods = getServicePeriods();

    // Initialize values when modal opens with pawn ticket data
    useEffect(() => {
        if (open && pawnTicket) {
            try {
                const baseCharge = parseFloat(pawnTicket.financeCharge || pawnTicket.finance_charge || '0');
                setServiceCharge(baseCharge.toFixed(2));

                // Calculate amounts based on pawn ticket
                const principal = parseFloat(pawnTicket.amountFinanced || pawnTicket.amount_financed || '0');
                const total = parseFloat(pawnTicket.totalOfPayments || pawnTicket.total_of_payments || '0');

                setAmountLeft(total.toFixed(2));
                setTotalPaid('0.00'); // No payments made yet
            } catch (error) {
                console.error('[ServiceChargeModal] Error initializing values:', error);
                // Set safe defaults
                setServiceCharge('0.00');
                setAmountLeft('0.00');
                setTotalPaid('0.00');
            }
        }
    }, [open, pawnTicket]);

    const formatMoney = (value: string) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const handleDone = () => {
        // Calculate total amount based on selected service options
        const total = parseFloat(serviceCharge) +
            parseFloat(partialPayment) +
            parseFloat(redemption) +
            parseFloat(lateCharge) +
            parseFloat(lostTicket);

        onDone(total);
    };

    const handleReset = () => {
        setServiceCharge('0.00');
        setPartialPayment('0.00');
        setRedemption('0.00');
        setLateCharge('0.00');
        setLostTicket('0.00');
    };

    const handlePeriodSelect = (idx: number, amount: number) => {
        setSelectedPeriod(idx);
        setServiceCharge(amount.toFixed(2));
    };

    const handleOverrideAmountChange = (value: string) => {
        if (value) {
            setServiceCharge(value);
        }
    };

    if (!open) return null;

    return (
        <div className="service-charge-modal-overlay">
            <div className="service-charge-modal">
                {/* Title Bar */}
                <div className="service-charge-modal-header">
                    <span>Calculate Charges - Ticket #{ticketNumber}</span>
                    <button onClick={onCancel} className="service-charge-modal-close-btn">
                        X
                    </button>
                </div>

                {/* Main Content */}
                <div className="service-charge-modal-content">
                    {/* Left Panel - Service Charges */}
                    <div className="service-charge-left-panel">
                        <div className="service-charge-payment-display">
                            <span className="service-charge-payment-text">Payment: </span>
                            <span className="service-charge-payment-text">0.00</span>
                        </div>

                        <div className="service-charge-input-grid">
                            <label>Service Charge:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={serviceCharge}
                                onChange={(e) => setServiceCharge(e.target.value)}
                                className="service-charge-input"
                            />

                            <label>Partial Payment:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={partialPayment}
                                onChange={(e) => setPartialPayment(e.target.value)}
                                className="service-charge-input"
                            />

                            <label>Future:</label>
                            <input
                                type="number"
                                value={future}
                                onChange={(e) => setFuture(e.target.value)}
                                className="service-charge-input"
                            />

                            <label>Principal Lower:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={principalLower}
                                onChange={(e) => setPrincipalLower(e.target.value)}
                                className="service-charge-input"
                            />

                            <label>Redemption:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={redemption}
                                onChange={(e) => setRedemption(e.target.value)}
                                className="service-charge-input"
                            />

                            <label>Late Charge:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={lateCharge}
                                onChange={(e) => setLateCharge(e.target.value)}
                                className="service-charge-input"
                            />

                            <label>Lost Ticket:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={lostTicket}
                                onChange={(e) => setLostTicket(e.target.value)}
                                className="service-charge-input"
                            />
                        </div>

                        <div className="service-charge-totals">
                            <label className="service-charge-total-label">Total Paid:</label>
                            <div className="service-charge-total-value">
                                {formatMoney(totalPaid)}
                            </div>

                            <label className="service-charge-total-label">Amount Left:</label>
                            <div className="service-charge-total-value">
                                {formatMoney(amountLeft)}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Period Selection */}
                    <div className="service-charge-right-panel">
                        <div className="service-charge-period-header">
                            Click to Select Service Charge
                        </div>

                        <table className="service-charge-period-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicePeriods.map((period, idx) => (
                                    <tr
                                        key={period.period}
                                        className={`service-charge-period-row ${selectedPeriod === idx ? 'selected' : ''}`}
                                        onClick={() => handlePeriodSelect(idx, period.amount)}
                                    >
                                        <td className="service-charge-period-cell">
                                            {period.period}
                                        </td>
                                        <td className="service-charge-period-cell">
                                            {period.date}
                                        </td>
                                        <td className="service-charge-period-cell">
                                            {period.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {servicePeriods.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="no-data">
                                            {/* ✅ Better error message */}
                                            {pawnTicket ? 'Invalid ticket dates' : 'No service periods available'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="service-charge-override-section">
                            <div>Overridden Amount</div>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                onChange={(e) => handleOverrideAmountChange(e.target.value)}
                                className="service-charge-override-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Buttons */}
                <div className="service-charge-modal-buttons">
                    <button onClick={handleReset} className="service-charge-btn">
                        Reset
                    </button>

                    <button onClick={onCancel} className="service-charge-btn">
                        Cancel
                    </button>

                    <button onClick={handleDone} className="service-charge-btn done">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
