import React, { useState } from 'react';
import './PaymentCreatePage.css';
import type { Customer as CustomerDto } from '../customer/types';
import CustomerPicker from '../customer/components/CustomerPicker';
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import LocatePawnsTab from './components/LocatePawnsTab';
import ViewPawnTab from './components/ViewPawnTab';
import MakePaymentTab from './components/MakePaymentTab';

type TabKey = 'customer' | 'additional' | 'viewPawn' | 'locatePawns' | 'makePayment';

interface SelectedPawnTicket {
  id: string;
  controlNumber: string;
  type: 'PAWN' | 'PURCHASE';
  amountFinanced?: number;
  totalOfPayments?: number;
  maturityDate: string;
  defaultDate: string;
  pawnStatus: string;
  items: any[];
  payments?: any[];
}

export default function PaymentCreatePage() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [active, setActive] = useState<TabKey>('customer');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [selectedPawn, setSelectedPawn] = useState<SelectedPawnTicket | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const navigate = useNavigate();

  function goto(tab: TabKey) { setActive(tab); }

  const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
    { key: 'customer', label: '1 - Customer Info' },
    { key: 'additional', label: '2 - Additional Info', disabled: !customerId },
    { key: 'viewPawn', label: '3 - View Pawn', disabled: !customerId },
    { key: 'locatePawns', label: '4 - Locate Pawns', disabled: !customerId },
    { key: 'makePayment', label: '5 - Make Payment', disabled: !selectedPawn },
  ];

  const confirmCancel = () => {
    setCancelOpen(false);
    // Reset flow
    setCustomerId(null);
    setCustomer(null);
    setSelectedPawn(null);
    setActive('customer');
    navigate('/', { replace: true });
  };

  const handlePawnSelected = (pawn: SelectedPawnTicket) => {
    setSelectedPawn(pawn);
    setActive('makePayment');
  };

  return (
    <div className="payment-flow-page">
      <div className="payment-flow">
        <nav className="payment-tabs" aria-label="Payment steps" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              disabled={t.disabled}
              className={"payment-tab " + (active === t.key ? 'is-active' : '')}
              onClick={() => goto(t.key)}
            >{t.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => setCancelOpen(true)} style={{ background: '#c62828', color: '#fff' }}>
            Cancel
          </button>
        </nav>

        {/* TAB CONTENT */}
        {active === 'customer' && (
          <div className="payment-panel">
            <CustomerPicker
              value={customer}
              onChange={setCustomer}
              onSelected={(id) => { setCustomerId(id); setActive('locatePawns'); }}
              onCreateNew={(tempId) => { setCustomerId(tempId); }}
            />
            <p className="hint">Select a customer to view their pawn tickets and make payments.</p>
          </div>
        )}

        {active === 'additional' && customerId && (
          <div className="payment-panel placeholder">
            <h2>Additional Customer Info</h2>
            <p>Extended customer profile information.</p>
            <button type="button" onClick={() => setActive('customer')}>← Back to Customer</button>
          </div>
        )}

        {active === 'viewPawn' && customerId && selectedPawn && (
          <ViewPawnTab
            pawnTicket={selectedPawn}
            onBack={() => setActive('locatePawns')}
            onMakePayment={() => setActive('makePayment')}
          />
        )}

        {active === 'locatePawns' && customerId && (
          <LocatePawnsTab
            customerId={customerId}
            onBack={() => setActive('customer')}
            onPawnSelected={handlePawnSelected}
            onViewPawn={(pawn) => {
              setSelectedPawn(pawn);
              setActive('viewPawn');
            }}
          />
        )}

        {active === 'makePayment' && selectedPawn && (
          <MakePaymentTab
            pawnTicket={selectedPawn}
            customerId={customerId!}
            onBack={() => setActive('locatePawns')}
            onPaymentComplete={() => {
              // Reset and go back to locate pawns to refresh data
              setSelectedPawn(null);
              setActive('locatePawns');
            }}
          />
        )}
      </div>

      <ConfirmModal
        open={cancelOpen}
        title="Cancel Payment"
        message="Are you sure you want to cancel the payment process?"
        confirmText="Yes, cancel"
        cancelText="No, keep working"
        onConfirm={confirmCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
