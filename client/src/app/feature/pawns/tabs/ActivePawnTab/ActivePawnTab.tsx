import { useState } from 'react';
import { useActivePawns } from '../../hooks/useActivePawns';
import { formatDate, formatCurrency as formatMoney } from '@/lib/utils';

export default function ActivePawnTab() {
  const { pawns, loading, error, refreshPawns } = useActivePawns();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredPawns = pawns.filter(pawn => {
    const matchesSearch = searchTerm === '' ||
      pawn.controlNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pawn.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || pawn.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

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
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-input {
          flex: 1;
          min-width: 300px;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .status-select {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          min-width: 150px;
        }

        .pawns-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .pawns-table th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .pawns-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #374151;
        }

        .pawns-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .currency {
          font-weight: 600;
          color: #059669;
        }

        .control-number {
          font-weight: 600;
          color: #3b82f6;
        }

        .loading-state {
          text-align: center;
          padding: 64px 20px;
          color: #6b7280;
        }

        .error-state {
          text-align: center;
          padding: 64px 20px;
          color: #dc2626;
          background: #fef2f2;
          border-radius: 8px;
          border: 1px solid #fecaca;
        }

        .empty-state {
          text-align: center;
          padding: 64px 20px;
          color: #6b7280;
        }

        .refresh-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .tab-content {
            margin: 16px;
            padding: 20px;
          }

          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-input {
            min-width: unset;
          }

          .pawns-table {
            font-size: 12px;
          }

          .pawns-table th,
          .pawns-table td {
            padding: 12px 8px;
          }
        }
      `}</style>

      <div className="tab-header">
        <h1 className="tab-title">
          💼 Active Pawn Loans
        </h1>
        <p className="tab-subtitle">
          Manage and monitor active pawn transactions
        </p>
      </div>

      <div className="filters-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search by control number or customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="status-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="past-due">Past Due</option>
          <option value="defaulted">Defaulted</option>
        </select>

        <button
          className="refresh-btn"
          onClick={loadActivePawns}
          disabled={loading}
        >
          {loading ? '🔄' : '↻'} Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div>🔄 Loading active pawns...</div>
        </div>
      ) : error ? (
        <div className="error-state">
          <div>❌ {error}</div>
          <button className="refresh-btn" onClick={loadActivePawns} style={{ marginTop: '16px' }}>
            Try Again
          </button>
        </div>
      ) : filteredPawns.length === 0 ? (
        <div className="empty-state">
          <div>📋 No active pawns found</div>
          {searchTerm && <div style={{ marginTop: '8px' }}>Try adjusting your search criteria</div>}
        </div>
      ) : (
        <table className="pawns-table">
          <thead>
            <tr>
              <th>Control #</th>
              <th>Customer</th>
              <th>Transaction Date</th>
              <th>Maturity Date</th>
              <th>Amount Financed</th>
              <th>Total Payment</th>
              <th>Items</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPawns.map((pawn) => (
              <tr key={pawn.id}>
                <td>
                  <span className="control-number">{pawn.controlNumber}</span>
                </td>
                <td>{pawn.customerName}</td>
                <td>{formatDate(pawn.transactionDate)}</td>
                <td>{formatDate(pawn.maturityDate)}</td>
                <td>
                  <span className="currency">{formatMoney(pawn.amountFinanced)}</span>
                </td>
                <td>
                  <span className="currency">{formatMoney(pawn.totalOfPayments)}</span>
                </td>
                <td>{pawn.itemCount} items</td>
                <td>
                  <span className={`status-badge status-${pawn.status}`}>
                    {pawn.status}
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
