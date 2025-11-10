import React, { useState } from 'react';

interface TenderMethod {
  id: string;
  name: string;
  amount: string;
}

interface Props {
  open: boolean;
  totalAmount: number;
  onCancel: () => void;
  onDone: (tenders: TenderMethod[]) => void;
}

export default function PaymentMethodModal({ open, totalAmount, onCancel, onDone }: Props) {
  const [tenders, setTenders] = useState<TenderMethod[]>([
    { id: '1', name: 'CASH', amount: totalAmount.toFixed(2) }
  ]);

  const updateTenderAmount = (id: string, amount: string) => {
    setTenders(prev => prev.map(t => 
      t.id === id ? { ...t, amount } : t
    ));
  };

  const addTender = () => {
    if (tenders.length >= 2) return; // Max 2 payment methods
    
    const newTender: TenderMethod = {
      id: Date.now().toString(),
      name: 'CASH',
      amount: '0.00'
    };
    setTenders(prev => [...prev, newTender]);
  };

  const removeTender = (id: string) => {
    if (tenders.length <= 1) return; // Keep at least one
    setTenders(prev => prev.filter(t => t.id !== id));
  };

  const updateTenderType = (id: string, name: string) => {
    setTenders(prev => prev.map(t => 
      t.id === id ? { ...t, name } : t
    ));
  };

  const getTotalTendered = () => {
    return tenders.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  };

  const getChange = () => {
    return Math.max(0, getTotalTendered() - totalAmount);
  };

  const tenderTypes = [
    'CASH',
    'AMERICAN EXPRESS', 
    'DEBIT',
    'DISCOVER',
    'MASTER CARD',
    'VISA',
    'CHECK'
  ];

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#f0f0f0',
        border: '2px outset #c0c0c0',
        padding: '8px',
        fontSize: '11px',
        minWidth: '400px'
      }}>
        {/* Title Bar */}
        <div style={{
          backgroundColor: '#c0c0c0',
          padding: '4px 8px',
          marginBottom: '8px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Payment Method Selection
        </div>

        {/* Payment Amount Display */}
        <div style={{
          marginBottom: '12px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Total Payment: ${totalAmount.toFixed(2)}
        </div>

        {/* Tender Methods */}
        <div style={{
          border: '2px inset #c0c0c0',
          padding: '8px',
          backgroundColor: 'white',
          marginBottom: '8px'
        }}>
          {tenders.map((tender, idx) => (
            <div key={tender.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '120px 80px 30px', 
              gap: '8px', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <select
                value={tender.name}
                onChange={(e) => updateTenderType(tender.id, e.target.value)}
                style={{
                  padding: '2px 4px',
                  border: '1px inset #c0c0c0',
                  fontSize: '11px'
                }}
              >
                {tenderTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                value={tender.amount}
                onChange={(e) => updateTenderAmount(tender.id, e.target.value)}
                style={{
                  padding: '2px 4px',
                  border: '1px inset #c0c0c0',
                  fontSize: '11px',
                  textAlign: 'right'
                }}
              />

              {tenders.length > 1 && (
                <button
                  onClick={() => removeTender(tender.id)}
                  style={{
                    padding: '1px 4px',
                    fontSize: '10px',
                    border: '1px outset #c0c0c0',
                    backgroundColor: '#f0f0f0'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {tenders.length < 2 && (
            <button
              onClick={addTender}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px outset #c0c0c0',
                backgroundColor: '#f0f0f0',
                marginTop: '4px'
              }}
            >
              + Add Payment Method
            </button>
          )}
        </div>

        {/* Summary */}
        <div style={{
          border: '2px inset #c0c0c0',
          padding: '8px',
          backgroundColor: 'white',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '4px' }}>
            <span>Total Tendered:</span>
            <span style={{ textAlign: 'right', fontWeight: 'bold' }}>
              ${getTotalTendered().toFixed(2)}
            </span>
            
            <span>Payment Amount:</span>
            <span style={{ textAlign: 'right' }}>
              ${totalAmount.toFixed(2)}
            </span>
            
            <span style={{ 
              color: getChange() > 0 ? 'green' : 'black',
              fontWeight: 'bold'
            }}>
              Change Due:
            </span>
            <span style={{ 
              textAlign: 'right', 
              fontWeight: 'bold',
              color: getChange() > 0 ? 'green' : 'black'
            }}>
              ${getChange().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'center' 
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              border: '2px outset #c0c0c0',
              backgroundColor: '#f0f0f0'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={() => onDone(tenders)}
            disabled={getTotalTendered() < totalAmount}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              border: '2px outset #c0c0c0',
              backgroundColor: getTotalTendered() >= totalAmount ? '#90EE90' : '#f0f0f0',
              fontWeight: 'bold',
              opacity: getTotalTendered() >= totalAmount ? 1 : 0.5
            }}
          >
            Process Payment
          </button>
        </div>
      </div>
    </div>
  );
}
