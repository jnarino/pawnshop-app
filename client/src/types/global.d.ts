// ✅ Consolidated global type definitions - remove electron.d.ts duplicate
declare global {
  interface Window {
    electronAPI?: {
      onNavigate?: (cb: (route: string) => void) => () => void;
      authChanged?: (authed: boolean) => void;
      refreshMenu?: () => void;
      onManageCash?: (cb: () => void) => () => void;
      onInventoryMaintain?: (cb: () => void) => () => void;
      printLabels?: (items: Array<{ 
        inventoryNumber: string; 
        description: string; 
        amount: string; 
      }>) => Promise<{ success: boolean; count?: number; error?: string }>;
      printDocument?: (html: string) => Promise<{ success: boolean; error?: string }>;
    };
  }

  namespace globalThis {
    var electronAPI: {
      onNavigate?: (cb: (route: string) => void) => () => void;
      authChanged?: (authed: boolean) => void;
      refreshMenu?: () => void;
      onManageCash?: (cb: () => void) => () => void;
      onInventoryMaintain?: (cb: () => void) => () => void;
      printLabels?: (items: Array<{ 
        inventoryNumber: string; 
        description: string; 
        amount: string; 
      }>) => Promise<{ success: boolean; count?: number; error?: string }>;
      printDocument?: (html: string) => Promise<{ success: boolean; error?: string }>;
    } | undefined;

    function open(url?: string, target?: string, features?: string): Window | null;
  }
}

export {};
