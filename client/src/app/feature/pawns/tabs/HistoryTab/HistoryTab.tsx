import { useState } from 'react';
import { usePawnHistory } from '../../hooks/usePawnHistory';

export default function HistoryTab() {
  const { history, loading, error, refreshHistory } = usePawnHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredHistory = history.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.controlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const itemDate = new Date(item.completedDate);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = itemDate >= startDate && itemDate <= endDate;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="tab-content">
      <style>{`
        .tab-content {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-header {
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tab-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .filters-section {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 16px;
          margin-bottom: 24px;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .search-input,
        .filter-select,
        .date-input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .search-input:focus,
        .filter-select:focus,
        .date-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .date-range {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .history-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .history-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #374151;
        }

        .history-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-redeemed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-defaulted {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-sold {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .type-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .type-pawn {
          background: #fef3c7;
          color: #92400e;
        }

        .type-purchase {
          background: #e0e7ff;
          color: #3730a3;
        }

        .currency {
          font-weight: 600;
          color: #059669;
        }

        .currency-negative {
          font-weight: 600;
          color: #dc2626;
        }

        .control-number {
          font-weight: 600;
          color: #3b82f6;
        }

        .refresh-btn {
          padding: 12px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          height: fit-content;
        }

        .refresh-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .loading-state,
        .error-state,
        .empty-state {
          text-align: center;
          padding: 64px 20px;
          color: #6b7280;
        }

        .error-state {
          color: #dc2626;
          background: #fef2f2;
          border-radius: 8px;
          border: 1px solid #fecaca;
        }

        @media (max-width: 768px) {
          .tab-content {
            margin: 16px;
            padding: 20px;
          }

          .filters-section {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .date-range {
            flex-direction: column;
            align-items: stretch;
          }

          .history-table {
            font-size: 12px;
          }

          .history-table th,
          .history-table td {
            padding: 12px 8px;
          }
        }
      `}</style>

      <div className="tab-header">
        <h1 className="tab-title">
          📜 Transaction History
        </h1>
        <p className="tab-subtitle">
          View completed pawn transactions and purchases
        </p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            type="text"
            className="search-input"
            placeholder="Control number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="PAWN">Pawn</option>
            <option value="PURCHASE">Purchase</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="redeemed">Redeemed</option>
            <option value="defaulted">Defaulted</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Date Range</label>
          <div className="date-range">
            <input
              type="date"
              className="date-input"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <span>to</span>
            <input
              type="date"
              className="date-input"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <button
          className="refresh-btn"
          onClick={loadHistory}
          disabled={loading}
        >
          {loading ? '🔄' : '↻'} Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div>🔄 Loading transaction history...</div>
        </div>
      ) : error ? (
        <div className="error-state">
          <div>❌ {error}</div>
          <button className="refresh-btn" onClick={loadHistory} style={{ marginTop: '16px' }}>
            Try Again
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <div>📋 No transactions found</div>
          {searchTerm && <div style={{ marginTop: '8px' }}>Try adjusting your search criteria</div>}
        </div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Control #</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Transaction Date</th>
              <th>Completed Date</th>
              <th>Original Amount</th>
              <th>Final Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="control-number">{item.controlNumber}</span>
                </td>
                <td>{item.customerName}</td>
                <td>
                  <span className={`type-badge type-${item.type.toLowerCase()}`}>
                    {item.type}
                  </span>
                </td>
                <td>{formatDate(item.transactionDate)}</td>
                <td>{formatDate(item.completedDate)}</td>
                <td>
                  <span className="currency">{formatCurrency(item.amount)}</span>
                </td>
                <td>
                  {item.finalAmount ? (
                    <span className="currency">{formatCurrency(item.finalAmount)}</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>—</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
