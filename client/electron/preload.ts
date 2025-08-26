import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (callback: (route: string) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, route: string) => {
            if (typeof route === 'string') callback(route);
        };
        ipcRenderer.on('navigate', handler);
        return () => ipcRenderer.removeListener('navigate', handler);
    },
    authChanged: (authed: boolean) => ipcRenderer.send('auth-changed', !!authed),
    refreshMenu: () => ipcRenderer.send('refresh-menu'),
});

declare global {
    interface Window {
        electronAPI?: {
            onNavigate?: (cb: (route: string) => void) => () => void;
            authChanged?: (authed: boolean) => void;
            refreshMenu?: () => void;
        };
    }
}
