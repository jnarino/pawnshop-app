import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (cb) => {
        const handler = (_, route) => cb(route);
        ipcRenderer.on('navigate', handler);
        return () => ipcRenderer.removeListener('navigate', handler);
    },
    authChanged: (authed) => {
        ipcRenderer.send('auth-changed', authed);
    },
    refreshMenu: () => {
        ipcRenderer.send('refresh-menu');
    },
    printLabels: (items) => ipcRenderer.invoke('print-labels', items),
    printDocument: (html) => ipcRenderer.invoke('print-document', html),
});
