export { };

declare global {
  interface Window {
    electronAPI?: {
      // Navigation
      onNavigate?: (cb: (route: string) => void) => () => void;
      authChanged?: (authed: boolean) => void;
      refreshMenu?: () => void;

      onPawnsMaintain?: (cb: () => void) => () => void;
      onPawnsForfeitPull?: (cb: () => void) => () => void;

      onSalesMaintain?: (cb: () => void) => () => void;
      onLayaway: (cb: () => void) => () => void;
      onMaintainLayaway: (cb: () => void) => () => void;

      onManageCash?: (cb: () => void) => () => void;
      onBalanceDrawer?: (cb: () => void) => () => void;

      onInventoryMaintain?: (cb: () => void) => () => void;
      onNewInventoryItem?: (cb: () => void) => () => void;

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
