import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (callback) => ipcRenderer.on('navigate', callback),
});
