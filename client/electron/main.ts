// electron/main.ts
import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow
let isAuthed = false; // retained for possible future use, no longer required for menu rendering

function buildMenu() {
    if (!mainWindow) return;
    const fileSub: Electron.MenuItemConstructorOptions[] = [
        { label: 'Log In', click: () => mainWindow.webContents.send('navigate', '/login') },
        { label: 'Log Out', click: () => mainWindow.webContents.send('navigate', '/logout') },
        { type: 'separator' },
        { role: 'quit' },
    ];
    const template: Electron.MenuItemConstructorOptions[] = [
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
        mainWindow.loadFile(indexHtml, { hash: 'login' })
    }

    buildMenu();
}

// ✅ Add IPC Handlers for printing at the bottom, before app.whenReady()

ipcMain.handle('print-labels', async (event, items) => {
  try {
    console.log('[Electron] Printing labels:', items);
    
    // TODO: Implement GoDEX printer communication
    // For now, use system printer as fallback
    return { success: true, count: items.length };
  } catch (error) {
    console.error('[Electron] Print labels failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Print failed' 
    };
  }
});

ipcMain.handle('print-document', async (event, html: string) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Create hidden window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    
    // Print to default printer
    await printWindow.webContents.print({
      silent: false, // Show print dialog
      printBackground: true,
      margins: { marginType: 'default' }
    });

    printWindow.close();
    return { success: true };
  } catch (error) {
    console.error('[Electron] Document print failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Print failed' 
    };
  }
});

app.whenReady().then(createMainWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow() })

// Listen for auth status changes from renderer
// auth-changed retained for potential future dynamic behavior but no longer required
ipcMain.on('auth-changed', (_evt, authed: boolean) => {
    isAuthed = !!authed;
    console.log('[Electron] auth-changed received (ignored for static menu). isAuthed=', isAuthed);
});

// Renderer can explicitly request a menu rebuild (e.g., after hot reload)
ipcMain.on('refresh-menu', () => {
    console.log('[Electron] refresh-menu requested. isAuthed=', isAuthed);
    buildMenu();
});
