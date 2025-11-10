import React, { useState, useEffect } from 'react';
import { http } from '@/app/core/api/http';

interface Props {
  pawnTicket: any;
  onBack: () => void;
  onMakePayment: () => void;
}

export default function ViewPawnTab({ pawnTicket, onBack, onMakePayment }: Props) {
  const [customer, setCustomer] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); // ✅ Add current user state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // ✅ Load both customer and current user data in parallel
        const [customerData, userData] = await Promise.all([
          http(`/api/customer/${pawnTicket.customerId || pawnTicket.customer_id}`),
          http('/api/auth/me') // ✅ Get current user info
        ]);
        
        setCustomer(customerData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pawnTicket]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatMoney = (amount?: number | string) => {
    if (!amount) return '0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const isOverdue = new Date(pawnTicket.maturityDate || pawnTicket.maturity_date) < new Date();
  const isPawn = (pawnTicket.type || pawnTicket.transaction_type) === 'PAWN';

  if (loading) {
    return (
      <div className="payment-panel">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading ticket details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-panel" style={{ padding: '8px', fontSize: '11px', backgroundColor: '#f0f0f0' }}>
      {/* Header with Customer Info - matching the image */}
      <div style={{
        backgroundColor: '#c0c0c0',
        border: '2px outset #c0c0c0',
        padding: '4px 8px',
        marginBottom: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        Customer #{pawnTicket.customerId?.slice(-5) || '19747'}: {customer?.firstName} {customer?.lastName}
      </div>

      {/* Action Buttons Row - matching the image */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '8px',
        justifyContent: 'flex-end'
      }}>
        <button style={{
          padding: '2px 8px',
          fontSize: '10px',
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        }}>Void</button>
        
        <button style={{
          padding: '2px 8px',
          fontSize: '10px',
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        }}>Buy</button>
        
        <button
          onClick={onMakePayment}
          style={{
            padding: '2px 8px',
            fontSize: '10px',
            border: '1px outset #c0c0c0',
            backgroundColor: pawnTicket.pawnStatus === 'active' ? '#90EE90' : '#f0f0f0'
          }}
        >Pay History</button>
        
        <button style={{
          padding: '2px 8px',
          fontSize: '10px',
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        }}>Undo Pay</button>
        
        <button style={{
          padding: '2px 8px',
          fontSize: '10px',
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        }}>Beware Hist</button>
        
        <button style={{
          padding: '2px 8px',
          fontSize: '10px',
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        }}>Print</button>
        
        <button style={{
          padding: '2px 8px',
          fontSize: '10px',
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        }}>Increase</button>
        
        <button style={{
          padding: '2px 8px',
          fontSize: '10px',
          border: '1px outset #c0c0c0',
          backgroundColor: '#f0f0f0'
        }}>Bin</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
        {/* Left Panel - Main Pawn Information */}
        <div>
          {/* Pawn Status and Basic Info */}
          <div style={{
            border: '2px inset #c0c0c0',
            backgroundColor: 'white',
            marginBottom: '4px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px',
              padding: '4px',
              fontSize: '10px'
            }}>
              {/* Row 1 */}
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Pawn</div>
                <div style={{
                  padding: '2px',
                  border: '1px inset #c0c0c0',
                  backgroundColor: isPawn ? '#90EE90' : '#ADD8E6',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '9px'
                }}>
                  {isPawn ? 'IN PAWN' : 'PURCHASE'}
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Duration</div>
                <div style={{ padding: '2px', border: '1px inset #c0c0c0', backgroundColor: 'white', textAlign: 'center' }}>
                  30
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>In</div>
                <div style={{ padding: '2px', border: '1px inset #c0c0c0', backgroundColor: 'white', textAlign: 'center' }}>
                  {formatDate(pawnTicket.transactionDate || pawnTicket.transaction_date)}
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Rate</div>
                <div style={{ padding: '2px', border: '1px inset #c0c0c0', backgroundColor: 'white', textAlign: 'center' }}>
                  {isPawn ? (((pawnTicket.periodicRate || pawnTicket.periodic_rate || 0.25) * 100).toFixed(0) + '%') : 'N/A'}
                </div>
              </div>

              <div>
                {/* ✅ Show actual username instead of hardcoded "JN" */}
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  Entered by: {currentUser?.username || 'Unknown'}
                </div>
                <div style={{ padding: '2px' }}>
                  <div style={{ fontSize: '9px' }}>Ticket #: <strong>{pawnTicket.controlNumber || pawnTicket.control_number}</strong></div>
                  <div style={{ fontSize: '9px' }}>Police #: {pawnTicket.controlNumber || pawnTicket.control_number}</div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Due Dates</div>
                <div style={{ fontSize: '9px' }}>
                  <div>Change Fees</div>
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Period</div>
                <div style={{ padding: '2px', border: '1px inset #c0c0c0', backgroundColor: 'white', textAlign: 'center' }}>
                  30
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Out</div>
                <div style={{
                  padding: '2px',
                  border: '1px inset #c0c0c0',
                  backgroundColor: isOverdue ? '#FFB6C1' : 'white',
                  color: isOverdue ? 'red' : 'black',
                  textAlign: 'center'
                }}>
                  {formatDate(pawnTicket.maturityDate || pawnTicket.maturity_date)}
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Amount</div>
                <div style={{
                  padding: '2px',
                  border: '1px inset #c0c0c0',
                  backgroundColor: 'white',
                  textAlign: 'right'
                }}>
                  {formatMoney(
                    isPawn ? (pawnTicket.amountFinanced || pawnTicket.amount_financed) :
                            (pawnTicket.purchaseTradeValue || pawnTicket.purchase_trade_value)
                  )}
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Total Paid</div>
                <div style={{
                  padding: '2px',
                  border: '1px inset #c0c0c0',
                  backgroundColor: 'white',
                  textAlign: 'right'
                }}>
                  0.00
                </div>
              </div>

              <div></div>
              <div></div>

              {/* Row 3 */}
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Service Charge</div>
                <div style={{
                  padding: '2px',
                  border: '1px inset #c0c0c0',
                  backgroundColor: 'white',
                  textAlign: 'right'
                }}>
                  {isPawn ? formatMoney(pawnTicket.financeCharge || pawnTicket.finance_charge) : '0.00'}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Period</div>
                <div style={{ padding: '2px', border: '1px inset #c0c0c0', backgroundColor: 'white', textAlign: 'center' }}>
                  30
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Redemption Price</div>
                <div style={{
                  padding: '2px',
                  border: '1px inset #c0c0c0',
                  backgroundColor: isOverdue ? '#FFB6C1' : 'white',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: isOverdue ? 'red' : 'black'
                }}>
                  {isPawn ? formatMoney(pawnTicket.totalOfPayments || pawnTicket.total_of_payments) : 
                           formatMoney(pawnTicket.purchaseTradeValue || pawnTicket.purchase_trade_value)}
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Forfeit</div>
                <div style={{ padding: '2px', border: '1px inset #c0c0c0', backgroundColor: 'white', textAlign: 'center' }}>
                  {formatDate(pawnTicket.defaultDate || pawnTicket.default_date)}
                </div>
              </div>

              <div></div>
              <div></div>
            </div>

            {/* Note Section */}
            <div style={{ padding: '4px', borderTop: '1px solid #c0c0c0' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>Note</div>
              <div style={{
                padding: '4px',
                border: '1px inset #c0c0c0',
                backgroundColor: 'white',
                minHeight: '30px',
                fontSize: '9px'
              }}>
                {/* Note content */}
              </div>
            </div>
          </div>

          {/* Items Section - matching the red header in the image */}
          <div style={{
            border: '2px inset #c0c0c0',
            backgroundColor: 'white'
          }}>
            <div style={{
              backgroundColor: '#ff4444',
              color: 'white',
              padding: '2px 4px',
              fontWeight: 'bold',
              fontSize: '10px'
            }}>
              Item Description
            </div>
            
            {/* Items Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 80px 1fr 60px 60px',
              backgroundColor: '#ffcccc',
              fontSize: '9px',
              fontWeight: 'bold',
              borderBottom: '1px solid #ccc'
            }}>
              <div style={{ padding: '2px 4px', borderRight: '1px solid #ccc' }}>Quantity</div>
              <div style={{ padding: '2px 4px', borderRight: '1px solid #ccc' }}>Amount Each</div>
              <div style={{ padding: '2px 4px', borderRight: '1px solid #ccc' }}>Description</div>
              <div style={{ padding: '2px 4px', borderRight: '1px solid #ccc' }}>Status</div>
              <div style={{ padding: '2px 4px' }}>Action</div>
            </div>

            {/* Items List */}
            <div style={{ maxHeight: '120px', overflow: 'auto' }}>
              {pawnTicket.items && pawnTicket.items.length > 0 ? (
                pawnTicket.items.map((item: any, idx: number) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 80px 1fr 60px 60px',
                    borderBottom: '1px solid #eee',
                    fontSize: '9px',
                    backgroundColor: idx % 2 === 0 ? 'white' : '#fffafa'
                  }}>
                    <div style={{ padding: '2px 4px', borderRight: '1px solid #eee' }}>
                      {item.quantity || 1}
                    </div>
                    <div style={{ padding: '2px 4px', borderRight: '1px solid #eee', textAlign: 'right' }}>
                      {formatMoney(item.priceAmount || item.price_amount)}
                    </div>
                    <div style={{ padding: '2px 4px', borderRight: '1px solid #eee' }}>
                      {(item.itemDescription || item.item_description || 'No description').toUpperCase()
                      }
                    </div>
                    <div style={{ padding: '2px 4px', borderRight: '1px solid #eee' }}>
                      {(item.status || 'IN PAWN').toUpperCase()}
                    </div>
                    <div style={{ padding: '2px 4px' }}>
                      {/* Action buttons */}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px', textAlign: 'center', fontStyle: 'italic', fontSize: '9px' }}>
                  No items found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - matching the image layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Top buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              onClick={onMakePayment}
              disabled={pawnTicket.pawnStatus !== 'active' && pawnTicket.pawn_status !== 'active'}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '2px outset #c0c0c0',
                backgroundColor: '#f0f0f0',
                cursor: 'pointer'
              }}
            >
              Pay History
            </button>
            
            <button
              onClick={onBack}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '2px outset #c0c0c0',
                backgroundColor: '#f0f0f0',
                cursor: 'pointer'
              }}
            >
              Exit
            </button>
          </div>

          {/* Bottom buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: 'auto' }}>
            <button style={{
              padding: '4px 8px',
              fontSize: '10px',
              border: '2px outset #c0c0c0',
              backgroundColor: '#f0f0f0'
            }}>View Item</button>
            
            <button style={{
              padding: '4px 8px',
              fontSize: '10px',
              border: '2px outset #c0c0c0',
              backgroundColor: '#f0f0f0'
            }}>Pawn Changes History</button>
          </div>
        </div>
      </div>
    </div>
  );
}
