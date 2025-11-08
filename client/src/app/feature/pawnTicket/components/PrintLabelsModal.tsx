import React, { useState } from 'react';
import './PrintLabelsModal.css';

interface PrintItem {
  id: string;
  inventoryNumber: string;
  description: string;
  amount: string;
  quantity?: number;
}

interface Props {
  open: boolean;
  controlNumber: string;
  items: PrintItem[];
  onPrint: (labelCounts: Record<string, number>) => void;
  onCancel: () => void;
}

export function PrintLabelsModal({ open, controlNumber, items, onPrint, onCancel }: Props) {
  // Initialize label counts - default 1 label per item
  const [labelCounts, setLabelCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(item => {
      initial[item.id] = 1;
    });
    return initial;
  });

  const updateLabelCount = (itemId: string, count: number) => {
    setLabelCounts(prev => ({
      ...prev,
      [itemId]: Math.max(0, Math.min(99, count)) // Limit between 0-99
    }));
  };

  const getTotalLabels = () => {
    return Object.values(labelCounts).reduce((sum, count) => sum + count, 0);
  };

  const handlePrint = () => {
    onPrint(labelCounts);
  };

  const handleReset = () => {
    const reset: Record<string, number> = {};
    items.forEach(item => {
      reset[item.id] = 1;
    });
    setLabelCounts(reset);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="print-labels-modal">
        <div className="modal-header">
          <h3>Enter # of PAWN Labels</h3>
          <button 
            type="button" 
            className="modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="labels-table-container">
            <table className="labels-table">
              <thead>
                <tr>
                  <th># Labels</th>
                  <th>Quantity</th>
                  <th>Description of Item</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={labelCounts[item.id] || 1}
                        onChange={(e) => updateLabelCount(item.id, parseInt(e.target.value) || 0)}
                        className="label-count-input"
                      />
                    </td>
                    <td>{item.quantity || 1}.00</td>
                    <td className="item-description">
                      {item.description.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={handlePrint}
              className="btn-primary"
              disabled={getTotalLabels() === 0}
            >
              Print Labels
            </button>
            
            <button 
              type="button" 
              onClick={handleReset}
              className="btn-secondary"
            >
              Reset
            </button>
            
            <button 
              type="button" 
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>

          <div className="labels-summary">
            Total Labels: <strong>{getTotalLabels()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
