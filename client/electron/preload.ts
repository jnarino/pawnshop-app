import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (cb: (route: string) => void) => {
        const handler = (_: any, route: string) => cb(route);
        ipcRenderer.on('navigate', handler);
        return () => ipcRenderer.removeListener('navigate', handler);
    },
    authChanged: (authed: boolean) => {
        ipcRenderer.send('auth-changed', authed);
    },
    refreshMenu: () => {
        ipcRenderer.send('refresh-menu');
    },
    printLabels: (items: Array<{
        inventoryNumber: string;
        description: string;
        amount: string
    }>) => ipcRenderer.invoke('print-labels', items),

    printDocument: (html: string) => ipcRenderer.invoke('print-document', html),
    getApiConfig: () => ipcRenderer.invoke('get-api-config'),

    // Menu-driven actions
    onManageCash: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:manage-cash', handler);
        return () => ipcRenderer.removeListener('menu:manage-cash', handler);
    },

    onInventoryMaintain: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:inventory-maintain', handler);
        return () => ipcRenderer.removeListener('menu:inventory-maintain', handler);
    },

    onNewInventoryItem: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:inventory-new', handler);
        return () => ipcRenderer.removeListener('menu:inventory-new', handler);
    },

    onPawnMaintain: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:pawn-maintain', handler);
        return () => ipcRenderer.removeListener('menu:pawn-maintain', handler);
    },

    onForfeit: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:forfeit-pull', handler);
        return () => ipcRenderer.removeListener('menu:forfeit-pull', handler);
    },

    onBalanceDrawer: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:balance-drawer', handler);
        return () => ipcRenderer.removeListener('menu:balance-drawer', handler);
    },
});
