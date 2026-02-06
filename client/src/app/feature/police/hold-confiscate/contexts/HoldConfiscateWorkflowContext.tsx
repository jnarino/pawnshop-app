import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { useWorkspaceTabs } from '@/app/shared/hooks/useWorkspaceTabs';

export type TabKey = 'list' | 'newHoldConfiscate';

export interface HoldConfiscateDraftState {
  holdDate: string;
  releasedDate?: string;
  caseNumber: string;
  employee: string;
  agency: string;
  jurisdiction: string;
  agentFirstName: string;
  agentMiddleInitial?: string;
  agentLastName: string;
  badgeNumber: string;
  phoneAreaCode: string;
  phoneNumber: string;
  phoneExtension?: string;
  comment: string;
  type: 'HOLD' | 'CONFISCATE';
  fromInput: string;
  items: PoliceHoldItem[];
}

import { PoliceHold, PoliceHoldItem } from '@/app/core/api/policeApi';
import { useAuthStore } from '@/app/core/store/useAuthStore';

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

function createInitialDraft(user: any): HoldConfiscateDraftState {
  const today = new Date();

  return {
    holdDate: today.toISOString().split('T')[0],
    releasedDate: '',
    caseNumber: '',
    employee: user?.username || '',
    agency: '',
    jurisdiction: '',
    agentFirstName: '',
    agentMiddleInitial: '',
    agentLastName: '',
    badgeNumber: '',
    phoneAreaCode: '',
    phoneNumber: '',
    phoneExtension: '',
    comment: '',
    type: 'HOLD',
    fromInput: '',
    items: []
  };
}

export function HoldConfiscateWorkflowProvider({ children, initialTicket, mode }: Readonly<{ children: ReactNode, initialTicket?: any, mode?: 'VIEW' | 'CREATE', isLayaway?: boolean }>) {
  const { activeTab, setActiveTab, navigateToTab } = useWorkspaceTabs<TabKey>({
    initialTab: 'list',
  });

  const user = useAuthStore((state) => state.user);

  const [holdConfiscateDraft, setHoldConfiscateDraft] = useState<HoldConfiscateDraftState>(createInitialDraft(user));
  const [selectedHold, setSelectedHold] = useState<PoliceHold | null>(null);

  const updateHoldConfiscateDraft = useCallback((updates: Partial<HoldConfiscateDraftState>) => {
    setHoldConfiscateDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetHoldConfiscateDraft = useCallback(() => {
    setHoldConfiscateDraft(createInitialDraft(user));
  }, [user]);

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
