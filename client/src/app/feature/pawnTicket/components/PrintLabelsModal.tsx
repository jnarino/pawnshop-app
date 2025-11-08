import React, { useState } from 'react';
import './PrintLabelsModal.css';

interface InventoryItem {
  id: string;
  inventoryNumber: string;
  description: string;
  amount: string;
}

interface Props {
  open: boolean;
  controlNumber: string;
  customerName: string;
  items: InventoryItem[];
  onPrint: () => Promise<void>;
  onCancel: () => void;
}

export function PrintLabelsModal({ open, controlNumber, customerName, items, onPrint, onCancel }: Props) {
  const [printing, setPrinting] = useState(false);

  if (!open) return null;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await onPrint();
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="print-modal-overlay">
      <div className="print-modal">
        <div className="print-modal-header">
          <h3>🏷️ Print Item Labels</h3>
          <button type="button" className="close-btn" onClick={onCancel} disabled={printing}>×</button>
        </div>

        <div className="print-modal-body">
          <div className="print-section">
            <h4>Transaction Summary</h4>
            <div className="summary-box">
              <div className="summary-row">
                <span>Control Number:</span>
                <strong>{controlNumber}</strong>
              </div>
              <div className="summary-row">
                <span>Customer:</span>
                <strong>{customerName}</strong>
              </div>
              <div className="summary-row">
                <span>Items:</span>
                <strong>{items.length}</strong>
              </div>
            </div>
          </div>

          <div className="print-section">
            <h4>Labels to Print</h4>
            <div className="items-list">
              {items.map((item, idx) => (
                <div key={item.id} className="label-preview">
                  <div className="label-number">#{idx + 1}</div>
                  <div className="label-content">
                    <div className="label-barcode">{item.inventoryNumber}</div>
                    <div className="label-desc">{item.description}</div>
                    <div className="label-amount">${item.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="print-info">
            <p>
              ℹ️ <strong>Transaction form already printed!</strong>
            </p>
            <ul>
              <li>✅ Florida Pawnbroker Transaction Form printed automatically</li>
              <li>🏷️ {items.length} item label{items.length !== 1 ? 's' : ''} ready for GoDEX printer</li>
            </ul>
            <p className="print-note">
              Click "Print Labels" to send labels to the thermal printer, then complete the transaction.
            </p>
          </div>
        </div>

        <div className="print-modal-footer">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handlePrint}
            disabled={printing}
          >
            {printing ? 'Printing...' : '🏷️ Print Labels & Complete'}
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onCancel}
            disabled={printing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
