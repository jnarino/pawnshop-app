import { createContext, useContext, useState, useMemo, useCallback, type ReactNode, useEffect } from 'react';
import type { Customer } from '@/app/feature/_shared/customer';
import type { FormMode, InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';
import { useWorkspaceTabs } from '@/app/shared/hooks/useWorkspaceTabs';
import { formatDate } from '@/lib/utils';
import { customerApi } from '@/app/core/api/customerApi';
export type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'customerPerformance' | 'history';

export interface PawnDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

export interface PawnWorkflowState {
  activeTab: TabKey;
  mode: FormMode;
  initialTicket: any;
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  pawnDraft: PawnDraftState;
  updatePawnDraft: (updates: Partial<PawnDraftState>) => void;
  resetPawnDraft: () => void;
  setActiveTab: (tab: TabKey) => void;
  navigateToTab: (tab: TabKey) => boolean;
  canNavigateToTab: (tab: TabKey) => boolean;
}

const PawnWorkflowContext = createContext<PawnWorkflowState | null>(null);

function createInitialDraft(): PawnDraftState {
  const today = new Date();
  const maturityDate = new Date(today);
  maturityDate.setDate(maturityDate.getDate() + 30);
  const expirationDate = new Date(today);
  expirationDate.setDate(expirationDate.getDate() + 60);

  return {
    type: 'PAWN',
    periodicRate: '25',
    transactionDate: formatDate(today),
    maturityDate: formatDate(maturityDate),
    expirationDate: formatDate(expirationDate),
    items: []
  };
}

export function PawnWorkflowProvider({ children, initialTicket, mode }: Readonly<{ children: ReactNode, initialTicket?: any, mode?: FormMode }>) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  const canNavigateToTab = useCallback((tab: TabKey) => {
    if (tab === 'customer') return true;
    return !!customer?.id;
  }, [customer?.id]);

  const { activeTab, setActiveTab, navigateToTab } = useWorkspaceTabs<TabKey>({
    initialTab: 'customer',
    canNavigate: canNavigateToTab
  });

  const [pawnDraft, setPawnDraft] = useState<PawnDraftState>(createInitialDraft);

  const updatePawnDraft = useCallback((updates: Partial<PawnDraftState>) => {
    setPawnDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetPawnDraft = useCallback(() => {
    setPawnDraft(createInitialDraft());
  }, []);

  const value = useMemo(() => ({
    activeTab,
    customer,
    setCustomer,
    pawnDraft,
    initialTicket,
    mode: mode || 'CREATE',
    updatePawnDraft,
    resetPawnDraft,
    setActiveTab,
    navigateToTab,
    canNavigateToTab,
  }), [activeTab, customer, pawnDraft, updatePawnDraft, resetPawnDraft, canNavigateToTab, setActiveTab, navigateToTab]);

  useEffect(() => {
    if (initialTicket) {
      const fetchCustomer = async () => {
        const customer = await customerApi.findCustomerById(initialTicket.customerId);
        setCustomer(customer);
      };
      fetchCustomer();
    }
  }, [initialTicket]);

  return (
    <PawnWorkflowContext.Provider value={value}>
      {children}
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
