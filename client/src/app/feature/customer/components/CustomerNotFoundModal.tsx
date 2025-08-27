import React from 'react';

interface CustomerNotFoundModalProps {
  open: boolean;
  onClose: () => void;
  onAddCustomer: () => void;
}

const CustomerNotFoundModal: React.FC<CustomerNotFoundModalProps> = ({ open, onClose, onAddCustomer }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="nf-title">
        <h2 id="nf-title">Customer not found</h2>
        <p>We couldn’t find a customer with the scanned DOB and ID number.</p>
        <p>Would you like to add this customer to the database?</p>
        <div className="modal-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose}>No, Close</button>
          <button type="button" onClick={onAddCustomer}>Yes, Add Customer</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerNotFoundModal;