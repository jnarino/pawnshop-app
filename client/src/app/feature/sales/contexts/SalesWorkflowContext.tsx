import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { Customer } from '@/app/feature/_shared/customer';
import type { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';
import { formatDate } from '@/lib/utils';
import { useWorkspaceTabs } from '@/app/shared/hooks/useWorkspaceTabs';

export type TabKey = 'customer' | 'customerPerformance' | 'additional' | 'newSale';

export interface SaleDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

export interface SaleWorkflowState {
  activeTab: TabKey;
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  pawnDraft: SaleDraftState;
  updatePawnDraft: (updates: Partial<SaleDraftState>) => void;
  resetPawnDraft: () => void;
  setActiveTab: (tab: TabKey) => void;
  navigateToTab: (tab: TabKey) => boolean;
}

const SalesWorkflowContext = createContext<SaleWorkflowState | null>(null);

function createInitialDraft(): SaleDraftState {
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

export function SalesWorkflowProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  const { activeTab, setActiveTab, navigateToTab } = useWorkspaceTabs<TabKey>({
    initialTab: 'newSale',
  });

  const [saleDraft, setSaleDraft] = useState<SaleDraftState>(createInitialDraft);

  const updateSaleDraft = useCallback((updates: Partial<SaleDraftState>) => {
    setSaleDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSaleDraft = useCallback(() => {
    setSaleDraft(createInitialDraft());
  }, []);

  const value = useMemo(() => ({
    activeTab,
    customer,
    setCustomer,
    pawnDraft: saleDraft,
    updatePawnDraft: updateSaleDraft,
    resetPawnDraft: resetSaleDraft,
    setActiveTab,
    navigateToTab,
  }), [activeTab, customer, saleDraft, updateSaleDraft, resetSaleDraft, setActiveTab, navigateToTab]);

  return (
    <SalesWorkflowContext.Provider value={value}>
      {children}
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
