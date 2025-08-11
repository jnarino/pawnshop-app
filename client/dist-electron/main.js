// electron/main.ts
import { app, BrowserWindow, Menu, dialog } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let mainWindow;
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            contextIsolation: true, // security best practice
            sandbox: true, // security best practice
            preload: join(__dirname, 'preload.js'),
        },
    });
    const isDev = !app.isPackaged; // <-- reliable dev/prod check
    if (isDev) {
        const url = 'http://localhost:5173/#/login';
        console.log('[Electron] Loading DEV URL:', url);
        mainWindow.loadURL(url);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        const indexHtml = join(__dirname, '../dist/index.html');
        console.log('[Electron] Loading PROD file:', indexHtml, 'hash=login');
        mainWindow.loadFile(indexHtml, { hash: 'login' }); // <-- ensure /login
    }
    const template = [
        { label: 'File', submenu: [{ role: 'quit' }] },
        {
            label: 'Customer',
            click: () => mainWindow.webContents.send('navigate', '/customer'),
        },
        {
            label: 'Reports',
            click: () => mainWindow.webContents.send('navigate', '/reports'),
        },
        {
            label: 'About',
            click: () => {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'About',
                    message: 'PawnShop App v1.0.0',
                    detail: 'Built with Electron, React & TypeScript',
                });
            },
        },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
app.whenReady().then(createMainWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin')
    app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0)
    createMainWindow(); });
