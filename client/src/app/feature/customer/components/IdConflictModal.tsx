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

export const IdConflictModal: React.FC<Props> = ({
  open,
  existingIdNumber,
  scannedIdNumber,
  customerName,
  onUpdateId,
  onKeepExisting,
  onCancel
}) => {
  if (!open) return null;

  return (
    <div className="idscan-overlay">
      <div className="idscan-modal">
        <h3>⚠️ ID Number Mismatch</h3>
        <div className="idscan-status" style={{ textAlign: 'left' }}>
          <p><strong>Customer:</strong> {customerName}</p>
          <p><strong>Database ID:</strong> {existingIdNumber || '—'}</p>
          <p><strong>Scanned ID:</strong> {scannedIdNumber || '—'}</p>
          <p style={{ marginTop: 16 }}>
            The scanned ID number does not match the stored value. Would you like to update the database?
          </p>
        </div>
        <div className="idscan-actions" style={{ marginTop: 20 }}>
          <button type="button" onClick={onUpdateId}>Update ID Number</button>
          <button type="button" onClick={onKeepExisting}>Keep Existing</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
