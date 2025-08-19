import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (callback) => ipcRenderer.on('navigate', callback),
    authChanged: (authed) => ipcRenderer.send('auth-changed', !!authed),
    refreshMenu: () => ipcRenderer.send('refresh-menu'),
});
