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

    /* Menu actions */

    // Pawns
    onPawnsMaintain: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:pawns-maintain', handler);
        return () => ipcRenderer.removeListener('menu:pawns-maintain', handler);
    },

    onPawnsForfeitPull: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:pawns-forfeit-pull', handler);
        return () => ipcRenderer.removeListener('menu:pawns-forfeit-pull', handler);
    },

    // Sales
    onSalesMaintain: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:sales-maintain', handler);
        return () => ipcRenderer.removeListener('menu:sales-maintain', handler);
    },

    onLayaway: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:sales-layaway', handler);
        return () => ipcRenderer.removeListener('menu:sales-layaway', handler);
    },

    onMaintainLayaway: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:sales-maintain-layaway', handler);
        return () => ipcRenderer.removeListener('menu:sales-maintain-layaway', handler);
    },

    // Cash drawers
    onManageCash: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:admin-cash-drawers-add-remove-cash', handler);
        return () => ipcRenderer.removeListener('menu:admin-cash-drawers-add-remove-cash', handler);
    },

    onBalanceDrawer: (cb: () => void) => {
        const handler = () => cb();
        ipcRenderer.on('menu:admin-cash-drawers-balance', handler);
        return () => ipcRenderer.removeListener('menu:admin-cash-drawers-balance', handler);
    },

    // Inventory
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
});
