import React from 'react';

interface Props {
  pawnTicket: any;
  onBack: () => void;
  onMakePayment: () => void;
}

export default function ViewPawnTab({ pawnTicket, onBack, onMakePayment }: Props) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatMoney = (amount?: number) => {
    return amount ? `$${amount.toFixed(2)}` : '$0.00';
  };

  const isOverdue = new Date(pawnTicket.maturityDate) < new Date();

  return (
    <div className="payment-panel">
      <div className="panel-header">
        <h2>View Pawn - Ticket #{pawnTicket.controlNumber}</h2>
        <div>
          <button type="button" onClick={onBack}>← Back</button>
          {pawnTicket.pawnStatus === 'active' && (
            <button 
              type="button" 
              onClick={onMakePayment}
              style={{ marginLeft: '8px', background: '#4caf50', color: 'white' }}
            >
              Make Payment
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column - Pawn Details */}
        <div className="pawn-details">
          <h3>Pawn Details</h3>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: '14px' }}>
            <strong>Type:</strong>
            <span>{pawnTicket.type}</span>
            
            <strong>Status:</strong>
            <span style={{ 
              color: pawnTicket.pawnStatus === 'active' ? '#4caf50' : '#f44336',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {pawnTicket.pawnStatus}
            </span>
            
            <strong>Date In:</strong>
            <span>{formatDate(pawnTicket.transactionDate)}</span>
            
            <strong>Date Out:</strong>
            <span>{formatDate(pawnTicket.maturityDate)}</span>
            
            <strong>Amount:</strong>
            <span>{formatMoney(pawnTicket.amountFinanced)}</span>
            
            <strong>Service Charge:</strong>
            <span>{formatMoney(pawnTicket.financeCharge)}</span>
            
            <strong>Redemption Price:</strong>
            <span style={{ fontWeight: 'bold', color: isOverdue ? '#f44336' : '#333' }}>
              {formatMoney(pawnTicket.totalOfPayments)}
            </span>
          </div>

          {isOverdue && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#ffebee', 
              border: '1px solid #f44336', 
              borderRadius: '4px',
              color: '#d32f2f'
            }}>
              <strong>⚠️ OVERDUE</strong> - This pawn ticket is past its maturity date.
            </div>
          )}
        </div>

        {/* Right Column - Items */}
        <div className="items-section">
          <h3>Items</h3>
          <div style={{ border: '1px solid #ccc', padding: '12px', background: '#fafafa' }}>
            <p>Items information coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
