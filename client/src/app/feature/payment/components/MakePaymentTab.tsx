import React, { useState, useEffect } from 'react';
import { http } from '@/app/core/api/http';
import { pawnTicketApi } from '@/app/core/api/pawnTicketApi';
import OtherPaymentModal from './OtherPaymentModal';
import { PawnTicketRow } from '../hooks/usePaymentFlow';
import PaymentMethodModal from '../../_shared/modal/PaymentMethodModal';

interface Props {
  pawnTicket: any;
  customerId: string;
  customer: any;
  tickets: PawnTicketRow[];
  onTicketsChange: (tickets: PawnTicketRow[]) => void;
  onBack: () => void;
  onPaymentComplete: () => void;
}

export default function MakePaymentTab({
  pawnTicket,
  customerId,
  customer,
  tickets,
  onTicketsChange,
  onBack,
  onPaymentComplete
}: Props) {
  const [loading, setLoading] = useState(tickets.length === 0);
  const [totalPayment, setTotalPayment] = useState('0.00');
  const [selectedCount, setSelectedCount] = useState(0);
  const [serviceChargeModalOpen, setServiceChargeModalOpen] = useState(false);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [selectedTicketForPayment, setSelectedTicketForPayment] = useState<string | null>(null);

  useEffect(() => {
    if (tickets.length === 0) {
      loadActiveTickets();
    } else {
      updateTotals(tickets);
    }
  }, [customerId]);

  const loadActiveTickets = async () => {
    try {
      setLoading(true);

      // Load all active pawn tickets for this customer using the enriched API
      const response = await pawnTicketApi.getActiveByCustomer(customerId);

      const ticketRows: PawnTicketRow[] = (response || []).map((ticket: any) => {
        const controlNumber = ticket.controlNumber || ticket.control_number;
        const dateIn = new Date(ticket.transactionDate || ticket.transaction_date);
        const dateOut = new Date(ticket.maturityDate || ticket.maturity_date);

        return {
          id: ticket.id,
          controlNumber: controlNumber || 'N/A',
          dateIn: dateIn.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          dateOut: dateOut.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          pawnAmount: parseFloat(ticket.amountFinanced || ticket.amount_financed || '0'),
          currentCharges: parseFloat(ticket.currentCharges || ticket.current_charges || '0'),
          redemption: parseFloat(ticket.redemptionAmount || ticket.redemption_amount || '0'),
          otherPayment: false,
          selected: ticket.id === pawnTicket?.id,
          periodsBehind: ticket.periodsBehind || 0,
          periodicRate: parseFloat(ticket.periodicRate || ticket.periodic_rate || '0')
        };
      });

      onTicketsChange(ticketRows);
      updateTotals(ticketRows);

    } catch (error) {
      console.error('Failed to load active tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update the updateTotals function to include other payment amounts
  const updateTotals = (ticketList: PawnTicketRow[]) => {
    const selectedTicketsTotal = ticketList
      .filter(t => t.selected)
      .reduce((sum, t) => sum + t.redemption, 0);

    const otherPaymentsTotal = ticketList
      .reduce((sum, t) => sum + (t.otherPaymentAmount || 0), 0);

    const total = selectedTicketsTotal + otherPaymentsTotal;

    setTotalPayment(total.toFixed(2));
    setSelectedCount(ticketList.filter(t => t.selected || (t.otherPaymentAmount && t.otherPaymentAmount > 0)).length);
  };

  const toggleTicketSelection = (ticketId: string) => {
    const updatedTickets = tickets.map(ticket =>
      ticket.id === ticketId
        ? { ...ticket, selected: !ticket.selected }
        : ticket
    );
    onTicketsChange(updatedTickets);
    updateTotals(updatedTickets);
  };

  const selectAll = () => {
    const updatedTickets = tickets.map(ticket => ({ ...ticket, selected: true }));
    onTicketsChange(updatedTickets);
    updateTotals(updatedTickets);
  };

  const redeemAll = () => {
    // Same as select all for now
    selectAll();
  };

  const clearAll = () => {
    const updatedTickets = tickets.map(ticket => ({
      ...ticket,
      selected: false,
      otherPayment: false,
      otherPaymentAmount: 0
    }));
    onTicketsChange(updatedTickets);
    updateTotals(updatedTickets);
  };

  const handleOtherPaymentClick = (ticketId: string) => {
    setSelectedTicketForPayment(ticketId);
    setServiceChargeModalOpen(true);
  };

  // ✅ Update handleServiceChargeComplete to properly update the ticket
  const handleServiceChargeComplete = (amount: number) => {
    setServiceChargeModalOpen(false);

    if (selectedTicketForPayment) {
      const updatedTickets = tickets.map(ticket =>
        ticket.id === selectedTicketForPayment
          ? { ...ticket, otherPaymentAmount: amount, otherPayment: amount > 0 }
          : ticket
      );
      onTicketsChange(updatedTickets);
      updateTotals(updatedTickets);
    }

    setSelectedTicketForPayment(null);
  };

  // ✅ Update handleSave to check for any payments (selected OR other payments)
  const handleSave = async () => {
    const selectedTickets = tickets.filter(t => t.selected);
    const otherPaymentTickets = tickets.filter(t => t.otherPaymentAmount && t.otherPaymentAmount > 0);

    if (selectedTickets.length === 0 && otherPaymentTickets.length === 0) {
      alert('Please select at least one ticket or enter payment amounts.');
      return;
    }

    // ✅ Use the already calculated totalPayment
    const totalAmount = parseFloat(totalPayment);

    if (totalAmount <= 0) {
      alert('Total payment amount must be greater than $0.00');
      return;
    }

    setPaymentMethodModalOpen(true);
  };

  // ✅ Updated handlePaymentMethodComplete to actually create payment records
  const handlePaymentMethodComplete = async (tenders: any[]) => {
    setPaymentMethodModalOpen(false);

    try {
      console.log('[Payment] Creating payment transactions...', { tenders, totalPayment });

      const selectedTickets = tickets.filter(t => t.selected);
      const otherPaymentTickets = tickets.filter(t => t.otherPaymentAmount && t.otherPaymentAmount > 0);

      // ✅ Create payment data structure for API
      const paymentData = {
        customerId,
        totalAmount: parseFloat(totalPayment),
        tenders: tenders.map(tender => ({
          type: tender.name,
          amount: parseFloat(tender.amount)
        })),
        pawnTicketPayments: [
          // Selected tickets (full redemption payments)
          ...selectedTickets.map(ticket => ({
            pawnTicketId: ticket.id,
            paymentType: 'redemption',
            interestPaid: ticket.currentCharges,
            principalPaid: ticket.pawnAmount,
            totalAmount: ticket.redemption,
            note: `Full redemption payment for ticket ${ticket.controlNumber}`
          })),
          // Other payment tickets (partial/service charge payments)
          ...otherPaymentTickets.map(ticket => ({
            pawnTicketId: ticket.id,
            paymentType: 'partial',
            interestPaid: ticket.otherPaymentAmount, // This comes from ServiceChargeModal
            principalPaid: 0,
            totalAmount: ticket.otherPaymentAmount,
            note: `Service charge payment for ticket ${ticket.controlNumber}`
          }))
        ]
      };

      console.log('[Payment] Sending payment data:', paymentData);

      // ✅ Use dedicated payment endpoint
      const paymentResult = await http('/api/payment/pawn-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      console.log('[Payment] Payment created successfully:', paymentResult);

      const totalAmount = parseFloat(totalPayment);
      const ticketCount = selectedTickets.length + otherPaymentTickets.length;

      alert(`✅ Payment of $${totalAmount.toFixed(2)} processed successfully!\n\n` +
        `${ticketCount} ticket(s) updated\n` +
        `Transaction ID: ${paymentResult.transactionId || 'N/A'}\n\n` +
        `Receipt would print here.`);

      // Reset and complete
      onPaymentComplete();

    } catch (error) {
      console.error('[Payment] Payment processing failed:', error);
      alert(`❌ Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`);
    }
  };

  if (loading) {
    return (
      <div className="payment-panel">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading active tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-panel" style={{ padding: '8px', fontSize: '11px', backgroundColor: '#f0f0f0' }}>
      {/* Header Section - matching the image */}
      <div style={{
        backgroundColor: '#c0c0c0',
        border: '2px outset #c0c0c0',
        padding: '4px 8px',
        marginBottom: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Customer #{customerId?.slice(-5) || '24852'} - {customer?.firstName?.toUpperCase()} {customer?.lastName?.toUpperCase()}</span>
        <button
          onClick={onBack}
          style={{
            padding: '2px 8px',
            fontSize: '10px',
            border: '1px outset #c0c0c0',
            backgroundColor: '#f0f0f0'
          }}
        >
          Exit
        </button>
      </div>

      {/* Payment Controls Section */}
      <div style={{
        border: '2px inset #c0c0c0',
        backgroundColor: 'white',
        padding: '8px',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>Edit Pawn Note</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontWeight: 'bold' }}>Total Payment:</span>
            <div style={{
              background: '#ff6666',
              color: 'white',
              padding: '2px 8px',
              fontWeight: 'bold',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {totalPayment}
            </div>
          </div>
        </div>

        {/* Selector Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>Selector:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={selectAll}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: '1px outset #c0c0c0',
                backgroundColor: '#f0f0f0'
              }}
            >
              Pay All
            </button>
            <button
              onClick={redeemAll}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: '1px outset #c0c0c0',
                backgroundColor: '#f0f0f0'
              }}
            >
              Redeem All
            </button>
            <button
              onClick={clearAll}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: '1px outset #c0c0c0',
                backgroundColor: '#f0f0f0'
              }}
            >
              Clear all
            </button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              disabled={parseFloat(totalPayment) <= 0}
              style={{
                padding: '4px 12px',
                fontSize: '10px',
                border: '1px outset #c0c0c0',
                backgroundColor: parseFloat(totalPayment) > 0 ? '#90EE90' : '#f0f0f0',
                fontWeight: 'bold',
                opacity: parseFloat(totalPayment) > 0 ? 1 : 0.5
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div style={{
        border: '2px inset #c0c0c0',
        backgroundColor: 'white',
        height: '300px',
        overflow: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e0e0e0', position: 'sticky', top: 0 }}>
              <th style={{ padding: '4px', border: '1px solid #c0c0c0', fontWeight: 'bold', textAlign: 'left' }}>
                Ticket #
              </th>
              <th style={{ padding: '4px', border: '1px solid #c0c0c0', fontWeight: 'bold', textAlign: 'left' }}>
                Date In
              </th>
              <th style={{ padding: '4px', border: '1px solid #c0c0c0', fontWeight: 'bold', textAlign: 'left' }}>
                Date Out
              </th>
              <th style={{ padding: '4px', border: '1px solid #c0c0c0', fontWeight: 'bold', textAlign: 'right' }}>
                Pawn Amt
              </th>
              <th style={{ padding: '4px', border: '1px solid #c0c0c0', fontWeight: 'bold', textAlign: 'right' }}>
                Current Charges
              </th>
              <th style={{ padding: '4px', border: '1px solid #c0c0c0', fontWeight: 'bold', textAlign: 'right' }}>
                Redemption
              </th>
              <th style={{ padding: '4px', border: '1px solid #c0c0c0', fontWeight: 'bold', textAlign: 'center' }}>
                Other Payment
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, idx) => (
              <tr
                key={ticket.id}
                onClick={() => toggleTicketSelection(ticket.id)}
                style={{
                  backgroundColor: ticket.selected ? '#add8e6' : (idx % 2 === 0 ? 'white' : '#f8f8f8'),
                  cursor: 'pointer'
                }}
              >
                <td style={{
                  padding: '4px',
                  border: '1px solid #d0d0d0',
                  fontWeight: ticket.selected ? 'bold' : 'normal'
                }}>
                  {ticket.controlNumber}
                </td>
                <td style={{ padding: '4px', border: '1px solid #d0d0d0' }}>
                  {ticket.dateIn}
                </td>
                <td style={{
                  padding: '4px',
                  border: '1px solid #d0d0d0',
                  color: new Date(ticket.dateOut) < new Date() ? 'red' : 'black'
                }}>
                  {ticket.dateOut}
                </td>
                <td style={{ padding: '4px', border: '1px solid #d0d0d0', textAlign: 'right' }}>
                  {ticket.pawnAmount.toFixed(2)}
                </td>
                <td style={{ padding: '4px', border: '1px solid #d0d0d0', textAlign: 'right' }}>
                  {ticket.currentCharges.toFixed(2)}
                </td>
                <td style={{
                  padding: '4px',
                  border: '1px solid #d0d0d0',
                  textAlign: 'right',
                  fontWeight: 'bold'
                }}>
                  {ticket.redemption.toFixed(2)}
                </td>
                <td style={{
                  padding: '4px',
                  border: '1px solid #d0d0d0',
                  textAlign: 'center'
                }}>
                  {/* ✅ Show amount if set, otherwise show checkbox */}
                  {ticket.otherPaymentAmount && ticket.otherPaymentAmount > 0 ? (
                    <span style={{
                      color: 'green',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOtherPaymentClick(ticket.id);
                      }}>
                      ${ticket.otherPaymentAmount.toFixed(2)}
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          handleOtherPaymentClick(ticket.id);
                        }
                      }}
                      style={{ transform: 'scale(0.8)' }}
                    />
                  )}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={7} style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  No active pawn tickets found for this customer
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Notes Section */}
      <div style={{
        border: '2px inset #c0c0c0',
        backgroundColor: 'white',
        marginTop: '8px',
        height: '80px'
      }}>
        <div style={{
          backgroundColor: '#c0c0c0',
          padding: '2px 4px',
          fontWeight: 'bold',
          fontSize: '10px'
        }}>
          Cust Note
        </div>
        <div style={{ padding: '4px', fontSize: '10px', height: '60px', overflow: 'auto' }}>
          {customer?.description || 'No customer notes available.'}
        </div>
      </div>

      {/* Other Payment Modal */}
      <OtherPaymentModal
        open={serviceChargeModalOpen}
        ticket={selectedTicketForPayment ? (() => {
          const t = tickets.find(ticket => ticket.id === selectedTicketForPayment);
          if (!t) return null;
          return {
            id: t.id,
            controlNumber: t.controlNumber,
            pawnAmount: t.pawnAmount,
            periodicRate: t.periodicRate || 0,
            periodsBehind: t.periodsBehind || 0
          };
        })() : null}
        onCancel={() => {
          setServiceChargeModalOpen(false);
          setSelectedTicketForPayment(null);
        }}
        onDone={handleServiceChargeComplete}
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        open={paymentMethodModalOpen}
        totalAmount={parseFloat(totalPayment)}
        onCancel={() => setPaymentMethodModalOpen(false)}
        onDone={handlePaymentMethodComplete}
      />
    </div>
  );
}
