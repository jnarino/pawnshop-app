import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (callback: (event: any, route: string) => void) =>
        ipcRenderer.on('navigate', callback),
    authChanged: (authed: boolean) => ipcRenderer.send('auth-changed', !!authed),
    refreshMenu: () => ipcRenderer.send('refresh-menu'),
})

declare global {
    // Extend existing declaration safely
    interface Window { electronAPI?: { onNavigate?: (cb: any)=>void; authChanged?: (authed: boolean)=>void; refreshMenu?: ()=>void } }
}
