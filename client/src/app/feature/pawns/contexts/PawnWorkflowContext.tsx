import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '@/app/shared/components/ConfirmModal';

export type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'customerPerformance' | 'history';

interface PawnWorkflowState {
  // Current tab
  activeTab: TabKey;
  
  // Cancel modal state
  cancelModalOpen: boolean;
  
  // Actions
  setActiveTab: (tab: TabKey) => void;
  canNavigateToTab: (tab: TabKey) => boolean;
  openCancelModal: () => void;
  closeCancelModal: () => void;
  confirmCancelTransaction: () => void;
}

const PawnWorkflowContext = createContext<PawnWorkflowState | null>(null);

export function PawnWorkflowProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  
  const navigate = useNavigate();

  const canNavigateToTab = (tab: TabKey) => {
    // All tabs are accessible now
    return true;
  };

  const openCancelModal = () => {
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
  };

  const confirmCancelTransaction = () => {
    // Reset workflow state
    setActiveTab('customer');
    setCancelModalOpen(false);
    // Navigate back to home
    navigate('/', { replace: true });
  };

  const value = useMemo(() => ({
    activeTab,
    cancelModalOpen,
    setActiveTab,
    canNavigateToTab,
    openCancelModal,
    closeCancelModal,
    confirmCancelTransaction
  }), [activeTab, cancelModalOpen]);

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
