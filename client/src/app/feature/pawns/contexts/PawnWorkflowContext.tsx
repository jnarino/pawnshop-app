import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Customer } from '../tabs/CustomerInfoTab/types';
import ConfirmModal from '@/app/shared/components/ConfirmModal';

export type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'history';

interface PawnWorkflowState {
  // Customer state
  customer: Customer | null;
  customerId: string | null;
  
  // Current tab
  activeTab: TabKey;
  
  // Cancel modal state
  cancelModalOpen: boolean;
  
  // Actions
  setCustomer: (customer: Customer | null) => void;
  setCustomerId: (id: string | null) => void;
  setActiveTab: (tab: TabKey) => void;
  canNavigateToTab: (tab: TabKey) => boolean;
  openCancelModal: () => void;
  closeCancelModal: () => void;
  confirmCancelTransaction: () => void;
}

const PawnWorkflowContext = createContext<PawnWorkflowState | null>(null);

export function PawnWorkflowProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleSetCustomer = (c: Customer | null) => {
    setCustomer(c);
    setCustomerId(c?.id || null);
  };

  const canNavigateToTab = (tab: TabKey) => {
    if (tab === 'customer') return true;
    return !!customerId;
  };

  const openCancelModal = () => {
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
  };

  const confirmCancelTransaction = () => {
    // Reset all state
    setCustomer(null);
    setCustomerId(null);
    setActiveTab('customer');
    setCancelModalOpen(false);
    // Navigate back to home
    navigate('/', { replace: true });
  };

  const value = useMemo(() => ({
    customer,
    customerId,
    activeTab,
    cancelModalOpen,
    setCustomer: handleSetCustomer,
    setCustomerId,
    setActiveTab,
    canNavigateToTab,
    openCancelModal,
    closeCancelModal,
    confirmCancelTransaction
  }), [customer, customerId, activeTab, cancelModalOpen]);

  return (
    <PawnWorkflowContext.Provider value={value}>
      {children}
      <ConfirmModal
        open={cancelModalOpen}
        title="Cancel Transaction"
        message="Are you sure you want to cancel the transaction? All unsaved changes will be lost."
        confirmText="Yes, cancel"
        cancelText="No, keep working"
        onConfirm={confirmCancelTransaction}
        onCancel={closeCancelModal}
      />
    </PawnWorkflowContext.Provider>
  );
}

export function usePawnWorkflow() {
  const context = useContext(PawnWorkflowContext);
  if (!context) {
    throw new Error('usePawnWorkflow must be used within PawnWorkflowProvider');
  }
  return context;
}
