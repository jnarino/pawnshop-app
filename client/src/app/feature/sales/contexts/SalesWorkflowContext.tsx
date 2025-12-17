import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import type { Customer } from '@/app/feature/_shared/customer';
import type { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';

export type TabKey = 'customer' | 'additional' | 'newSale';

export interface SaleDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

interface SaleWorkflowState {
  activeTab: TabKey;
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  pawnDraft: SaleDraftState;
  updatePawnDraft: (updates: Partial<SaleDraftState>) => void;
  resetPawnDraft: () => void;
  cancelModalOpen: boolean;
  setActiveTab: (tab: TabKey) => void;
  canNavigateToTab: (tab: TabKey) => boolean;
  openCancelModal: () => void;
  closeCancelModal: () => void;
  confirmCancelTransaction: () => void;
}

const SalesWorkflowContext = createContext<SaleWorkflowState | null>(null);

function createInitialDraft(): SaleDraftState {
  const today = new Date();
  const maturityDate = new Date(today);
  maturityDate.setDate(maturityDate.getDate() + 30);
  const expirationDate = new Date(today);
  expirationDate.setDate(expirationDate.getDate() + 60);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return {
    type: 'PAWN',
    periodicRate: '25',
    transactionDate: formatDate(today),
    maturityDate: formatDate(maturityDate),
    expirationDate: formatDate(expirationDate),
    items: []
  };
}

export function SalesWorkflowProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [saleDraft, setSaleDraft] = useState<SaleDraftState>(createInitialDraft);

  const navigate = useNavigate();

  const canNavigateToTab = useCallback((tab: TabKey) => {
    if (tab === 'customer') return true;
    return !!customer?.id;
  }, [customer?.id]);

  const updateSaleDraft = useCallback((updates: Partial<SaleDraftState>) => {
    setSaleDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSaleDraft = useCallback(() => {
    setSaleDraft(createInitialDraft());
  }, []);

  const openCancelModal = useCallback(() => {
    setCancelModalOpen(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    setCancelModalOpen(false);
  }, []);

  const confirmCancelTransaction = useCallback(() => {
    setActiveTab('customer');
    setCustomer(null);
    setSaleDraft(createInitialDraft());
    setCancelModalOpen(false);
    navigate('/', { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({
    activeTab,
    customer,
    setCustomer,
    saleDraft,
    updateSaleDraft,
    resetSaleDraft,
    cancelModalOpen,
    setActiveTab,
    canNavigateToTab,
    openCancelModal,
    closeCancelModal,
    confirmCancelTransaction
  }), [activeTab, customer, saleDraft, cancelModalOpen, updateSaleDraft, resetSaleDraft, canNavigateToTab, openCancelModal, closeCancelModal, confirmCancelTransaction]);

  return (
    <SalesWorkflowContext.Provider value={value}>
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
    </SalesWorkflowContext.Provider>
  );
}

export function useSalesWorkflow() {
  const context = useContext(SalesWorkflowContext);
  if (!context) {
    throw new Error('useSalesWorkflow must be used within SalesWorkflowProvider');
  }
  return context;
}
