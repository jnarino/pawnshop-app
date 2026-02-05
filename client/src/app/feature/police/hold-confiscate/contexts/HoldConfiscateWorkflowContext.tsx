import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';
import { formatDate } from '@/lib/utils';
import { useWorkspaceTabs } from '@/app/shared/hooks/useWorkspaceTabs';

export type TabKey = 'list' | 'newHoldConfiscate';

export interface HoldConfiscateDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

import { policeApi, PoliceHold } from '@/app/core/api/policeApi';

export interface HoldConfiscateWorkflowState {
  activeTab: TabKey;
  mode: 'VIEW' | 'CREATE';
  initialTicket: any;
  holdConfiscateDraft: HoldConfiscateDraftState;
  updateHoldConfiscateDraft: (updates: Partial<HoldConfiscateDraftState>) => void;
  resetHoldConfiscateDraft: () => void;
  setActiveTab: (tab: TabKey) => void;
  navigateToTab: (tab: TabKey) => boolean;
  selectedHold: PoliceHold | null;
  setSelectedHold: (hold: PoliceHold | null) => void;
}

const HoldConfiscateWorkflowContext = createContext<HoldConfiscateWorkflowState | null>(null);

function createInitialDraft(): HoldConfiscateDraftState {
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

export function HoldConfiscateWorkflowProvider({ children, initialTicket, mode }: Readonly<{ children: ReactNode, initialTicket?: any, mode?: 'VIEW' | 'CREATE', isLayaway?: boolean }>) {
  const { activeTab, setActiveTab, navigateToTab } = useWorkspaceTabs<TabKey>({
    initialTab: 'list',
  });

  const [holdConfiscateDraft, setHoldConfiscateDraft] = useState<HoldConfiscateDraftState>(createInitialDraft);
  const [selectedHold, setSelectedHold] = useState<PoliceHold | null>(null);

  const updateHoldConfiscateDraft = useCallback((updates: Partial<HoldConfiscateDraftState>) => {
    setHoldConfiscateDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetHoldConfiscateDraft = useCallback(() => {
    setHoldConfiscateDraft(createInitialDraft());
  }, []);

  const value = useMemo(() => ({
    activeTab,
    mode: mode || 'CREATE',
    initialTicket,
    holdConfiscateDraft,
    updateHoldConfiscateDraft,
    resetHoldConfiscateDraft,
    setActiveTab,
    navigateToTab,
    selectedHold,
    setSelectedHold,
  }), [activeTab, holdConfiscateDraft, updateHoldConfiscateDraft, resetHoldConfiscateDraft, setActiveTab, navigateToTab, selectedHold]);

  return (
    <HoldConfiscateWorkflowContext.Provider value={value}>
      {children}
    </HoldConfiscateWorkflowContext.Provider>
  );
}

export function useHoldConfiscateWorkflow() {
  const context = useContext(HoldConfiscateWorkflowContext);
  if (!context) {
    throw new Error('useHoldConfiscateWorkflow must be used within HoldConfiscateWorkflowProvider');
  }
  return context;
}
