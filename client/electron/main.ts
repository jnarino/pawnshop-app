// electron/main.ts
import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow
let isAuthed = false;

function buildMenu() {
    if (!mainWindow) return;
    const disabledWhenLoggedOut = !isAuthed;
    const fileSub: Electron.MenuItemConstructorOptions[] = [];
    if (isAuthed) {
        fileSub.push({ label: 'Log Out', click: () => mainWindow.webContents.send('navigate', '/logout') });
    } else {
        fileSub.push({ label: 'Log In', click: () => mainWindow.webContents.send('navigate', '/login') });
    }
    fileSub.push({ type: 'separator' }, { role: 'quit' });

    const template: Electron.MenuItemConstructorOptions[] = [
        { label: 'File', submenu: fileSub },
        {
            label: 'Customer',
            enabled: !disabledWhenLoggedOut,
            click: () => mainWindow.webContents.send('navigate', '/customer'),
        },
        {
            label: 'Pawn',
            enabled: !disabledWhenLoggedOut,
            click: () => mainWindow.webContents.send('navigate', '/pawn'),
        },
        {
            label: 'Reports',
            enabled: !disabledWhenLoggedOut,
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
                })
            },
        },
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            contextIsolation: true,     // security best practice
            sandbox: true,              // security best practice
            preload: join(__dirname, 'preload.js'),
        },
    })

    const isDev = !app.isPackaged   // <-- reliable dev/prod check

    if (isDev) {
        const url = 'http://localhost:5173/#/login'
        console.log('[Electron] Loading DEV URL:', url)
        mainWindow.loadURL(url)
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        const indexHtml = join(__dirname, '../dist/index.html')
        console.log('[Electron] Loading PROD file:', indexHtml, 'hash=login')
        mainWindow.loadFile(indexHtml, { hash: 'login' })  // <-- ensure /login
    }

    buildMenu();
}

app.whenReady().then(createMainWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow() })

// Listen for auth status changes from renderer
ipcMain.on('auth-changed', (_evt, authed: boolean) => {
    isAuthed = !!authed;
    buildMenu();
});
