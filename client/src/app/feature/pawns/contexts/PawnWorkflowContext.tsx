import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import type { Customer } from '@/app/feature/_shared/customer';
import type { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';

export type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'customerPerformance' | 'history';

export interface PawnDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

interface PawnWorkflowState {
  activeTab: TabKey;
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  pawnDraft: PawnDraftState;
  updatePawnDraft: (updates: Partial<PawnDraftState>) => void;
  resetPawnDraft: () => void;
  cancelModalOpen: boolean;
  setActiveTab: (tab: TabKey) => void;
  canNavigateToTab: (tab: TabKey) => boolean;
  openCancelModal: () => void;
  closeCancelModal: () => void;
  confirmCancelTransaction: () => void;
}

const PawnWorkflowContext = createContext<PawnWorkflowState | null>(null);

function createInitialDraft(): PawnDraftState {
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

export function PawnWorkflowProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pawnDraft, setPawnDraft] = useState<PawnDraftState>(createInitialDraft);
  
  const navigate = useNavigate();

  const canNavigateToTab = useCallback((tab: TabKey) => {
    if (tab === 'customer') return true;
    return !!customer?.id;
  }, [customer?.id]);

  const updatePawnDraft = useCallback((updates: Partial<PawnDraftState>) => {
    setPawnDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetPawnDraft = useCallback(() => {
    setPawnDraft(createInitialDraft());
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
    setPawnDraft(createInitialDraft());
    setCancelModalOpen(false);
    navigate('/', { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({
    activeTab,
    customer,
    setCustomer,
    pawnDraft,
    updatePawnDraft,
    resetPawnDraft,
    cancelModalOpen,
    setActiveTab,
    canNavigateToTab,
    openCancelModal,
    closeCancelModal,
    confirmCancelTransaction
  }), [activeTab, customer, pawnDraft, cancelModalOpen, updatePawnDraft, resetPawnDraft, canNavigateToTab, openCancelModal, closeCancelModal, confirmCancelTransaction]);

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
