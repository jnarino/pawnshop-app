// electron/main.ts
import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let mainWindow;
let isAuthed = false; // retained for possible future use, no longer required for menu rendering
function buildMenu() {
    if (!mainWindow)
        return;
    const fileSub = [
        { label: 'Log In', click: () => mainWindow.webContents.send('navigate', '/login') },
        { label: 'Log Out', click: () => mainWindow.webContents.send('navigate', '/logout') },
        { type: 'separator' },
        { role: 'quit' },
    ];
    const template = [
        { label: 'File', submenu: fileSub },
        // Keep other menus always enabled; route guards in renderer still enforce auth
        { label: 'Customer', click: () => mainWindow.webContents.send('navigate', '/customer') },
        { label: 'Pawn', click: () => mainWindow.webContents.send('navigate', '/pawn') },
        { label: 'Reports', click: () => mainWindow.webContents.send('navigate', '/reports') },
        { label: 'About', click: () => dialog.showMessageBox(mainWindow, { type: 'info', title: 'About', message: 'PawnShop App v1.0.0', detail: 'Built with Electron, React & TypeScript' }) },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
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
        mainWindow.loadFile(indexHtml, { hash: 'login' });
    }
    buildMenu();
}
app.whenReady().then(createMainWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin')
    app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0)
    createMainWindow(); });
// Listen for auth status changes from renderer
// auth-changed retained for potential future dynamic behavior but no longer required
ipcMain.on('auth-changed', (_evt, authed) => {
    isAuthed = !!authed;
    console.log('[Electron] auth-changed received (ignored for static menu). isAuthed=', isAuthed);
});
// Renderer can explicitly request a menu rebuild (e.g., after hot reload)
ipcMain.on('refresh-menu', () => {
    console.log('[Electron] refresh-menu requested. isAuthed=', isAuthed);
    buildMenu();
});
