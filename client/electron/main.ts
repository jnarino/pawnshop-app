// electron/main.ts
import { app, BrowserWindow, Menu, dialog, ipcMain, screen } from 'electron'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { fork, ChildProcess } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { DockerManager } from './docker-manager.js'


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow
let serverProcess: ChildProcess | null = null; // Reference to server process
let isAuthed = false; // retained for possible future use, no longer required for menu rendering
let appConfig = {
  mode: 'server', // 'server' (default) or 'client'
  serverUrl: 'http://localhost:3000'
};

function loadConfig() {
  try {
    // Check next to the executable (portable mode friendly)
    const exeDir = dirname(app.getPath('exe'));
    const localConfigPath = join(exeDir, 'config.json');

    // Check in userData (standard install friendly)
    const userDataConfigPath = join(app.getPath('userData'), 'config.json');

    // Check in resources (bundled with installer)
    // In dev: process.resourcesPath is usually node_modules/electron/dist/resources (not useful)
    // In prod: it's inside the app bundle or next to it
    const resourcesConfigPath = join(process.resourcesPath, 'config.json');

    let configPath = '';

    if (existsSync(localConfigPath)) {
      configPath = localConfigPath;
    } else if (existsSync(userDataConfigPath)) {
      configPath = userDataConfigPath;
    } else if (existsSync(resourcesConfigPath)) {
      configPath = resourcesConfigPath;
    }

    if (configPath) {
      console.log('[Electron] Loading config from:', configPath);
      const data = readFileSync(configPath, 'utf-8');
      const json = JSON.parse(data);
      if (json.mode) appConfig.mode = json.mode;
      if (json.serverUrl) appConfig.serverUrl = json.serverUrl;
    } else {
      console.log('[Electron] No config.json found, using defaults:', appConfig);
    }
  } catch (err) {
    console.error('[Electron] Failed to load config:', err);
  }
}


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


app.whenReady().then(async () => {
  loadConfig();

  // ONLY start Database/Server if in SERVER mode
  if (appConfig.mode === 'server') {
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
  } else {
    console.log(`[Electron] Running in CLIENT mode. Connecting to: ${appConfig.serverUrl}`);
  }

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

ipcMain.handle('get-api-config', () => {
  return appConfig;
});
