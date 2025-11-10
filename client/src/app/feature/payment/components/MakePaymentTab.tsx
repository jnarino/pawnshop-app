import { useState } from 'react';
import { http } from '@/app/core/api/http';

interface Props {
  pawnTicket: any;
  customerId: string;
  onBack: () => void;
  onPaymentComplete: () => void;
}

export default function MakePaymentTab({ pawnTicket, customerId, onBack, onPaymentComplete }: Props) {
  const [paymentAmount, setPaymentAmount] = useState('0.00');
  const [selectedTender, setSelectedTender] = useState('CASH');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatMoney = (amount?: number) => {
    return amount ? `$${amount.toFixed(2)}` : '$0.00';
  };

  const totalPayment = parseFloat(paymentAmount || '0');
  const change = Math.max(0, totalPayment - (pawnTicket.totalOfPayments || 0));

  const handlePayment = async () => {
    if (totalPayment <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Simple placeholder - would integrate with actual payment API
      alert(`Payment of ${formatMoney(totalPayment)} processed successfully!`);
      onPaymentComplete();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-panel">
      <div className="panel-header">
        <h2>Make Payment - Ticket #{pawnTicket.controlNumber}</h2>
        <button type="button" onClick={onBack}>← Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Left Panel - Payment Form */}
        <div className="payment-form" style={{ border: '1px solid #ccc', padding: '16px' }}>
          <h3>💰 Payment Information</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Payment Amount:
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Tender Type:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {['CASH', 'CREDIT CARD', 'DEBIT', 'CHECK'].map(tender => (
                <label key={tender} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="radio"
                    name="tender"
                    value={tender}
                    checked={selectedTender === tender}
                    onChange={(e) => setSelectedTender(e.target.value)}
                  />
                  {tender}
                </label>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div style={{ background: '#f5f5f5', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Total Payment:</span>
              <span style={{ fontWeight: 'bold' }}>{formatMoney(totalPayment)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Amount Due:</span>
              <span>{formatMoney(pawnTicket.totalOfPayments)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderTop: '1px solid #ddd', 
              paddingTop: '4px',
              fontWeight: 'bold',
              color: change > 0 ? '#4caf50' : '#333'
            }}>
              <span>Change:</span>
              <span>{formatMoney(change)}</span>
            </div>
          </div>

          {error && (
            <div style={{ color: '#f44336', marginBottom: '16px', padding: '8px', background: '#ffebee' }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={processing || totalPayment <= 0}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#4caf50', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Processing...' : 'Process Payment'}
          </button>
        </div>

        {/* Right Panel - Ticket Details */}
        <div className="ticket-details">
          <h3>Ticket Summary</h3>
          <div style={{ border: '1px solid #ccc', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
              <strong>Ticket #:</strong>
              <span>{pawnTicket.controlNumber}</span>
              
              <strong>Type:</strong>
              <span>{pawnTicket.type}</span>
              
              <strong>Principal:</strong>
              <span>{formatMoney(pawnTicket.amountFinanced)}</span>
              
              <strong>Service Charge:</strong>
              <span>{formatMoney(pawnTicket.financeCharge)}</span>
              
              <strong>Total Due:</strong>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {formatMoney(pawnTicket.totalOfPayments)}
              </span>
              
              <strong>Maturity Date:</strong>
              <span>{new Date(pawnTicket.maturityDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
