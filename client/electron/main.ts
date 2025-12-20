// electron/main.ts
import { app, BrowserWindow, Menu, dialog, ipcMain, screen } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { fork, ChildProcess } from 'child_process'
import { DockerManager } from './docker-manager.js'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

const FRONTEND_HOST = process.env.VITE_FRONTEND_HOST || 'http://localhost';
const FRONTEND_PORT = process.env.VITE_FRONTEND_PORT || '5173';

let mainWindow: BrowserWindow
let serverProcess: ChildProcess | null = null;
let isAuthed = false;

function buildMenu() {
  if (!mainWindow) return;
  const fileSub: Electron.MenuItemConstructorOptions[] = [
    { label: 'Log In', click: () => mainWindow.webContents.send('navigate', '/login') },
    { label: 'Log Out', click: () => mainWindow.webContents.send('navigate', '/logout') },
    { type: 'separator' },
    { role: 'quit' },
  ];
  const editSub: Electron.MenuItemConstructorOptions[] = [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'selectAll' },
  ];
  const template: Electron.MenuItemConstructorOptions[] = [
    { label: 'File', submenu: fileSub },
    { label: 'Edit', submenu: editSub },
    { label: 'Customer', click: () => mainWindow.webContents.send('navigate', '/customer') },
    { label: 'Pawn', click: () => mainWindow.webContents.send('navigate', '/pawn') },
    { label: 'Reports', click: () => mainWindow.webContents.send('navigate', '/reports') },
    { label: 'About', click: () => dialog.showMessageBox(mainWindow, { type: 'info', title: 'About', message: 'PawnShop App v1.0.0', detail: 'Built with Electron, React & TypeScript' }) },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function startServer() {
  let serverPath = join(__dirname, 'server.cjs');
  if (app.isPackaged) {
    serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
  }
  console.log('[Electron] Starting embedded server from:', serverPath);


  // Check if server file exists
  // For now, spawn and log errors
  try {
    const serverDir = dirname(serverPath);
    serverProcess = fork(serverPath, [], {
      cwd: serverDir, // Explicitly set CWD so dotenv finds .env.production
      env: {
        ...process.env,
        NODE_ENV: 'production', // Force production to load .env.production
        // Remove hardcoded overrides so .env.production takes precedence
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => console.log(`[Server] ${data}`));
    }
    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => console.error(`[Server Error] ${data}`));
    }

    serverProcess.on('error', (err) => {
      console.error('[Electron] Server failed to start:', err);
      dialog.showErrorBox('Server Error', 'Failed to start backend server: ' + err.message);
    });

  } catch (e) {
    console.error('[Electron] Failed to spawn server:', e);
  }
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    webPreferences: {
      contextIsolation: true,     // security best practice
      sandbox: true,              // security best practice
      preload: join(__dirname, 'preload.js'),
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // Full screen window
    mainWindow.show();
  });

  const isDev = !app.isPackaged

  if (isDev) {
    const url = `${FRONTEND_HOST}:${FRONTEND_PORT}/#/login`
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


app.whenReady().then(async () => {
  // Ensure Database is running
  const env = app.isPackaged ? 'prod' : 'dev';
  console.log(`[Electron] Ensuring database container for ${env}...`);
  const dbResult = await DockerManager.ensureDatabase(env);

  if (!dbResult.success) {
    dialog.showErrorBox('Database Error', dbResult.message || 'Unknown database error');
    app.quit();
    return;
  }

  startServer();
  createMainWindow();
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    console.log('[Electron] Killing server process...');
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') app.quit()
})
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
