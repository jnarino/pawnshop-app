import { useState, useEffect } from 'react';
import { http } from '@/app/core/api/http';

interface Props {
  customerId: string;
  onBack: () => void;
  onPawnSelected: (pawn: any) => void;
  onViewPawn: (pawn: any) => void;
}

export default function LocatePawnsTab({ customerId, onBack, onPawnSelected, onViewPawn }: Props) {
  const [pawnTickets, setPawnTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTicket, setSearchTicket] = useState('');

  useEffect(() => {
    loadPawnTickets();
  }, [customerId]);

  const loadPawnTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Search for pawn tickets for this customer
      const tickets = await http(`/api/pawnTicket?customerId=${customerId}&limit=50`);
      setPawnTickets(tickets || []);
    } catch (err) {
      console.error('[LocatePawnsTab] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pawn tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTicket.trim()) {
      loadPawnTickets();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Search by ticket number
      const results = await http(`/api/pawnTicket/search?controlNumber=${searchTicket.trim()}&customerId=${customerId}`);
      setPawnTickets(results || []);
    } catch (err) {
      console.error('[LocatePawnsTab] Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatMoney = (amount?: number | string) => {
    // ✅ Fix: Handle string/null values properly
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4caf50';
      case 'defaulted': return '#f44336';
      case 'redeemed': return '#2196f3';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="payment-panel">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading pawn tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-panel">
      <div className="panel-header">
        <h2>Locate Pawns</h2>
        <button type="button" onClick={onBack}>← Back</button>
      </div>

      {/* Search Section */}
      <div className="search-section" style={{ marginBottom: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ minWidth: '100px' }}>
            Ticket #:
            <input
              type="text"
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              placeholder="Enter ticket number"
              style={{ marginLeft: '8px', padding: '4px 8px' }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </label>
          <button type="button" onClick={handleSearch} style={{ padding: '6px 12px' }}>
            Search
          </button>
          <button type="button" onClick={loadPawnTickets} style={{ padding: '6px 12px' }}>
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: '#f44336', padding: '12px', background: '#ffebee', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Results Table */}
      <div className="results-section">
        <table className="pawns-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#e0e0e0' }}>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Customer #</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Ticket #</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Date In</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Amount</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pawnTickets.map((ticket) => (
              <tr key={ticket.id} style={{ background: ticket.pawnStatus === 'active' ? '#e8f5e8' : '#fff' }}>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  {customerId?.slice(-6) || 'N/A'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                  {ticket.controlNumber || ticket.control_number || 'N/A'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  {formatDate(ticket.transactionDate || ticket.transaction_date)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>
                  {/* ✅ Fix: Safely get amount value */}
                  {formatMoney(
                    ticket.amountFinanced || 
                    ticket.amount_financed || 
                    ticket.purchaseTradeValue || 
                    ticket.purchase_trade_value ||
                    0
                  )}
                </td>
                <td style={{ 
                  padding: '8px', 
                  border: '1px solid #ccc',
                  color: getStatusColor(ticket.pawnStatus || ticket.pawn_status),
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {ticket.pawnStatus || ticket.pawn_status || 'unknown'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => onViewPawn(ticket)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      View
                    </button>
                    {(ticket.pawnStatus === 'active' || ticket.pawn_status === 'active') && (
                      <button
                        type="button"
                        onClick={() => onPawnSelected(ticket)}
                        style={{ padding: '4px 8px', fontSize: '12px', background: '#4caf50', color: 'white' }}
                      >
                        Select
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pawnTickets.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic' }}>
                  No pawn tickets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Item Description Section */}
      <div className="item-description-section" style={{ marginTop: '20px' }}>
        <h3>Item Description</h3>
        <div style={{ 
          minHeight: '100px', 
          border: '1px solid #ccc', 
          padding: '12px', 
          background: '#fafafa',
          fontSize: '14px'
        }}>
          {pawnTickets.length > 0 ? (
            <p>Select a pawn ticket above to view item details.</p>
          ) : (
            <p>No items to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}
