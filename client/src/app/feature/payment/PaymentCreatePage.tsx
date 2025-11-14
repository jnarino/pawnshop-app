import React, { useState } from 'react';
import './PaymentCreatePage.css';
import type { Customer as CustomerDto } from '../customer/types';
import { CustomerManager } from '../customer';
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
  const [active, setActive] = useState<TabKey>('customer');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [selectedPawn, setSelectedPawn] = useState<SelectedPawnTicket | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const navigate = useNavigate();

  function goto(tab: TabKey) { setActive(tab); }

  const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
    { key: 'customer', label: '1 - Customer Info' },
    { key: 'additional', label: '2 - Additional Info', disabled: !customer?.id },
    { key: 'viewPawn', label: '3 - View Pawn', disabled: !customer?.id },
    { key: 'locatePawns', label: '4 - Locate Pawns', disabled: !customer?.id },
    { key: 'makePayment', label: '5 - Make Payment', disabled: !selectedPawn },
  ];

  const confirmCancel = () => {
    setCancelOpen(false);
    // Reset flow
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
            <CustomerManager
              customer={customer}
              onCustomerChange={setCustomer}
              onCustomerSelected={() => setActive('locatePawns')}
              showAdditionalInfo={false}
              showAlertWhenEmpty={true}
              className="h-full"
            />
          </div>
        )}

        {active === 'additional' && customer?.id && (
          <div className="payment-panel placeholder">
            <h2>Additional Customer Info</h2>
            <p>Extended customer profile information.</p>
            <button type="button" onClick={() => setActive('customer')}>← Back to Customer</button>
          </div>
        )}

        {active === 'viewPawn' && customer?.id && selectedPawn && (
          <ViewPawnTab
            pawnTicket={selectedPawn}
            onBack={() => setActive('locatePawns')}
            onMakePayment={() => setActive('makePayment')}
          />
        )}

        {active === 'locatePawns' && customer?.id && (
          <LocatePawnsTab
            customerId={customer.id}
            onBack={() => setActive('customer')}
            onPawnSelected={handlePawnSelected}
            onViewPawn={(pawn) => {
              setSelectedPawn(pawn);
              setActive('viewPawn');
            }}
          />
        )}

        {active === 'makePayment' && selectedPawn && customer?.id && (
          <MakePaymentTab
            pawnTicket={selectedPawn}
            customerId={customer.id}
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
