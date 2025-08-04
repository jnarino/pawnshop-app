import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (callback: (event: any, route: string) => void) =>
        ipcRenderer.on('navigate', callback),
})
