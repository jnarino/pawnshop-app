import React from 'react';
import './CustomerIdScanModal.css';

interface Props {
  open: boolean;
  customerName: string;
  onProceed: () => void;
  onEdit: () => void;
}

export const ReviewCustomerModal: React.FC<Props> = ({
  open,
  customerName,
  onProceed,
  onEdit
}) => {
  if (!open) return null;

  return (
    <div className="idscan-overlay">
      <div className="idscan-modal">
        <h3>Customer Loaded</h3>
        <div className="idscan-status">
          <p><strong>{customerName}</strong></p>
          <p style={{ marginTop: 16 }}>
            Review the populated customer information before proceeding with the pawn ticket.
          </p>
        </div>
        <div className="idscan-actions" style={{ marginTop: 20 }}>
          <button type="button" onClick={onProceed}>Proceed to Pawn</button>
          <button type="button" onClick={onEdit}>Edit Information</button>
        </div>
      </div>
    </div>
  );
};
