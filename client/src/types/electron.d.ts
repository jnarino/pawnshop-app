export { };

declare global {
  interface Window {
    electronAPI?: {
      // Navigation
      onNavigate?: (cb: (route: string) => void) => () => void;
      authChanged?: (authed: boolean) => void;
      refreshMenu?: () => void;
      onManageCash?: (cb: () => void) => () => void;
      onInventoryMaintain?: (cb: () => void) => () => void;
      onPawnMaintain?: (cb: () => void) => () => void;
      onBalanceDrawer?: (cb: () => void) => () => void;
      onForfeit?: (cb: () => void) => () => void;

      // ✅ Printing
      printLabels?: (items: Array<{
        inventoryNumber: string;
        description: string;
        amount: string
      }>) => Promise<{ success: boolean; count?: number; error?: string }>;

      printDocument?: (html: string) => Promise<{ success: boolean; error?: string }>;

      // ✅ Config
      getApiConfig?: () => Promise<{ mode?: 'server' | 'client'; serverUrl?: string }>;
    };
  }
}
