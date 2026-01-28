import { createContext, useContext, useState, useMemo, useCallback, type ReactNode, useEffect } from 'react';
import type { Customer } from '@/app/feature/_shared/customer';
import type { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';
import { useWorkspaceTabs } from '@/app/shared/hooks/useWorkspaceTabs';
import { formatDate } from '@/lib/utils';
import { customerApi } from '@/app/core/api/customerApi';
export type TabKey = 'customer' | 'newLayaway';

export interface LayawayDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  mode: any;
  initialTicket: any;
  isLayaway: boolean;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

export interface LayawayWorkflowState {
  activeTab: TabKey;
  customer: Customer | null;
  mode: any;
  isLayaway: boolean;
  initialTicket: any;
  setCustomer: (customer: Customer | null) => void;
  pawnDraft: LayawayDraftState;
  updatePawnDraft: (updates: Partial<LayawayDraftState>) => void;
  resetPawnDraft: () => void;
  setActiveTab: (tab: TabKey) => void;
  navigateToTab: (tab: TabKey) => boolean;
  canNavigateToTab: (tab: TabKey) => boolean;
}

const LayawayWorkflowContext = createContext<LayawayWorkflowState | null>(null);

function createInitialDraft(): LayawayDraftState {
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

export function LayawayWorkflowProvider({ children, initialTicket, mode, isLayaway }: Readonly<{ children: ReactNode, initialTicket?: any, mode?: 'VIEW' | 'CREATE', isLayaway?: boolean }>) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  const canNavigateToTab = useCallback((tab: TabKey) => {
    if (tab === 'customer') return true;
    return !!customer?.id;
  }, [customer?.id]);

  const { activeTab, setActiveTab, navigateToTab } = useWorkspaceTabs<TabKey>({
    initialTab: 'customer',
    canNavigate: canNavigateToTab
  });

  const [pawnDraft, setPawnDraft] = useState<LayawayDraftState>(createInitialDraft);

  const updatePawnDraft = useCallback((updates: Partial<LayawayDraftState>) => {
    setPawnDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetPawnDraft = useCallback(() => {
    setPawnDraft(createInitialDraft());
  }, []);

  useEffect(() => {
    if (initialTicket) {
      const fetchCustomer = async () => {
        const customer = await customerApi.findCustomerById(initialTicket.customer.id);
        setCustomer(customer);
      };
      fetchCustomer();
    }
  }, [initialTicket]);

  const value = useMemo(() => ({
    activeTab,
    customer,
    mode: mode || 'CREATE',
    isLayaway: isLayaway || false,
    initialTicket,
    setCustomer,
    pawnDraft,
    updatePawnDraft,
    resetPawnDraft,
    setActiveTab,
    navigateToTab,
    canNavigateToTab,
  }), [activeTab, customer, pawnDraft, updatePawnDraft, resetPawnDraft, canNavigateToTab, setActiveTab, navigateToTab]);

  return (
    <LayawayWorkflowContext.Provider value={value}>
      {children}
    </LayawayWorkflowContext.Provider>
  );
}

export function useLayawayWorkflow() {
  const context = useContext(LayawayWorkflowContext);
  if (!context) {
    throw new Error('useLayawayWorkflow must be used within LayawayWorkflowProvider');
  }
  return context;
}
