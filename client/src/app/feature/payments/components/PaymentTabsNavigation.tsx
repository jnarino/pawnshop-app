import React from 'react';
import type { TabKey, SelectedPawnTicket } from '../hooks/usePaymentFlow';

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  customerId: string | null;
  selectedPawn: SelectedPawnTicket | null;
  onCancel: () => void;
}

export default function PaymentTabsNavigation({ 
  activeTab, 
  onTabChange, 
  customerId, 
  selectedPawn, 
  onCancel 
}: Props) {
  const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
    { key: 'customer', label: '1 - Customer Info' },
    { key: 'additional', label: '2 - Additional Info', disabled: !customerId },
    { key: 'viewPawn', label: '3 - View Pawn', disabled: !customerId },
    { key: 'locatePawns', label: '4 - Locate Pawns', disabled: !customerId },
    { key: 'makePayment', label: '5 - Make Payment', disabled: !selectedPawn },
  ];

  return (
    <nav className="payment-tabs" aria-label="Payment steps">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          disabled={tab.disabled}
          className={`payment-tab ${activeTab === tab.key ? 'is-active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button 
        type="button" 
        onClick={onCancel} 
        className="payment-cancel-btn"
      >
        Cancel
      </button>
    </nav>
  );
}
