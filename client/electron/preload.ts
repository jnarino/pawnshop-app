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
});
