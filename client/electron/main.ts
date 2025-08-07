import { app, BrowserWindow, Menu, dialog } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
        },
    })

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173')
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    // build the native menu
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'File',
            submenu: [{ role: 'quit' }],
        },
        {
            label: 'Customer',
            click: () => {
                mainWindow.webContents.send('navigate', '/customer')
            },
        },
        {
            label: 'Reports',
            click: () => {
                mainWindow.webContents.send('navigate', '/reports')
            },
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

app.whenReady().then(createMainWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})
