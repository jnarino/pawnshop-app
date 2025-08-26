import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    onNavigate: (callback) => {
        const handler = (_event, route) => {
            if (typeof route === 'string')
                callback(route);
        };
        ipcRenderer.on('navigate', handler);
        return () => ipcRenderer.removeListener('navigate', handler);
    },
    authChanged: (authed) => ipcRenderer.send('auth-changed', !!authed),
    refreshMenu: () => ipcRenderer.send('refresh-menu'),
});
