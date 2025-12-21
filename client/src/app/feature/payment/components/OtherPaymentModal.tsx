import React, { useState, useEffect, useMemo } from 'react';
import './OtherPaymentModal.css';

interface Props {
    open: boolean;
    ticket: {
        id: string;
        controlNumber: string;
        pawnAmount: number;
        periodicRate: number;
        periodsBehind: number;
    } | null;
    onCancel: () => void;
    onDone: (amount: number) => void;
}

export default function OtherPaymentModal({ open, ticket, onCancel, onDone }: Props) {
    const [selectedPeriods, setSelectedPeriods] = useState<number[]>([]);

    // Calculate charge for a single period
    const onePeriodCharge = useMemo(() => {
        if (!ticket) return 0;
        return ticket.pawnAmount * (ticket.periodicRate || 0);
    }, [ticket]);

    // Handle period selection - Cumulative logic
    const togglePeriod = (periodNum: number) => {
        setSelectedPeriods(prev => {
            const isCurrentlySelected = prev.includes(periodNum);
            if (isCurrentlySelected) {
                // If deselecting, deselect this and all subsequent periods
                return prev.filter(p => p < periodNum);
            } else {
                // If selecting, select this and all previous periods
                const newSelection = [];
                for (let i = 1; i <= periodNum; i++) {
                    newSelection.push(i);
                }
                return newSelection;
            }
        });
    };

    const totalAmount = selectedPeriods.length * onePeriodCharge;

    // Reset selection when modal opens with a new ticket
    useEffect(() => {
        if (open) {
            setSelectedPeriods([]);
        }
    }, [open, ticket?.id]);

    if (!open || !ticket) return null;

    return (
        <div className="other-payment-modal-overlay">
            <div className="other-payment-modal">
                <div className="other-payment-header">
                    <h3>Other Payment - Ticket #{ticket.controlNumber}</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>

                <div className="other-payment-body">
                    <div className="ticket-summary">
                        <div className="summary-item">
                            <span>Pawn Amount:</span>
                            <strong>${ticket.pawnAmount.toFixed(2)}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Monthly Rate:</span>
                            <strong>{(ticket.periodicRate * 100).toFixed(2)}%</strong>
                        </div>
                        <div className="summary-item">
                            <span>Period Charge:</span>
                            <strong>${onePeriodCharge.toFixed(2)}</strong>
                        </div>
                        <div className="summary-item highlighted">
                            <span>Periods Behind:</span>
                            <strong>{ticket.periodsBehind}</strong>
                        </div>
                    </div>

                    <div className="periods-selection-section">
                        <p>Select periods to pay (Cumulative):</p>
                        <div className="periods-list">
                            {Array.from({ length: ticket.periodsBehind }).map((_, i) => {
                                const periodNum = i + 1;
                                const isSelected = selectedPeriods.includes(periodNum);
                                const cumulativeAmount = periodNum * onePeriodCharge;

                                return (
                                    <div
                                        key={i}
                                        className={`period-list-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => togglePeriod(periodNum)}
                                    >
                                        <div className="period-checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="period-details">
                                            <span className="period-name">Pay through Period {periodNum}</span>
                                            <span className="period-accumulation">
                                                {periodNum} {periodNum === 1 ? 'month' : 'months'} total
                                            </span>
                                        </div>
                                        <div className="period-amount-column">
                                            <span className="period-item-total">${cumulativeAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="other-payment-footer">
                    <div className="total-display">
                        <span>Selected Total:</span>
                        <strong>${totalAmount.toFixed(2)}</strong>
                    </div>
                    <div className="action-buttons">
                        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
                        <button
                            className="btn-done"
                            onClick={() => onDone(totalAmount)}
                            disabled={selectedPeriods.length === 0}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
