import React from 'react';
import './CustomerIdScanModal.css';

interface Props {
  open: boolean;
  existingIdNumber: string;
  scannedIdNumber: string;
  customerName: string;
  onUpdateId: () => void;
  onKeepExisting: () => void;
  onCancel: () => void;
}

export function IdConflictModal({
  open,
  existingIdNumber,
  scannedIdNumber,
  customerName,
  onUpdateId,
  onKeepExisting,
  onCancel
}: Props) {
  if (!open) return null;

  return (
    <div className="idscan-overlay">
      <div className="idscan-modal" style={{ maxWidth: '600px' }}>
        <h3 style={{ margin: '0 0 16px 0' }}>⚠️ ID Number Changed</h3>
        
        <div className="idscan-status" style={{ textAlign: 'left', marginBottom: '20px' }}>
          <p style={{ marginBottom: '12px', fontSize: '0.95rem' }}>
            Customer <strong>{customerName}</strong> appears to have renewed their ID.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '16px',
            alignItems: 'center',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>
                Current ID in System:
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                fontWeight: 600,
                textAlign: 'center',
                background: '#fef3c7',
                color: '#92400e',
                border: '2px solid #fbbf24'
              }}>
                {existingIdNumber || '—'}
              </div>
            </div>

            <div style={{ fontSize: '1.5rem', color: '#9ca3af', fontWeight: 'bold' }}>→</div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>
                New Scanned ID:
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                fontWeight: 600,
                textAlign: 'center',
                background: '#dbeafe',
                color: '#1e40af',
                border: '2px solid #3b82f6'
              }}>
                {scannedIdNumber || '—'}
              </div>
            </div>
          </div>

          <p style={{ marginTop: '20px', fontWeight: 600 }}>
            Would you like to update the ID number in the system?
          </p>
        </div>

        <div className="idscan-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onUpdateId} style={{
            background: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Yes, Update ID Number
          </button>
          <button type="button" onClick={onKeepExisting} style={{
            background: '#e5e7eb',
            color: '#374151',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            No, Keep Existing ID
          </button>
          <button type="button" onClick={onCancel} style={{
            background: '#6b7280',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
