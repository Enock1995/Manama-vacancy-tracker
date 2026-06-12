const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');

// Persistent config store
const store = new Store();

// Keep global reference to prevent garbage collection
let mainWindow;
let splashWindow;

// Reliable dev mode detection — works on Windows, Mac, Linux
const isDev = process.argv.includes('--dev') || !app.isPackaged;

// ─────────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────────
function createSplash() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: { nodeIntegration: false },
    });
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ─────────────────────────────────────────────
// MAIN WINDOW
// ─────────────────────────────────────────────
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        show: false,
        title: 'MatSouth Vacancy Tracker',
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    if (isDev) {
        // Development — load from React dev server (Vite)
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Production — load built React files
        mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.destroy();
        }
        mainWindow.show();
        mainWindow.maximize();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open external links in system browser, not inside Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// ─────────────────────────────────────────────
// APP LIFECYCLE
// ─────────────────────────────────────────────
app.whenReady().then(async () => {
    createSplash();

    // Small delay so splash screen is visible
    setTimeout(() => {
        createMainWindow();
    }, 2000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ─────────────────────────────────────────────
// IPC — Config / Settings
// ─────────────────────────────────────────────
ipcMain.handle('get-config', (event, key) => {
    return store.get(key);
});

ipcMain.handle('set-config', (event, key, value) => {
    store.set(key, value);
    return true;
});

ipcMain.handle('get-all-config', () => {
    return store.store;
});

// ─────────────────────────────────────────────
// IPC — App Info
// ─────────────────────────────────────────────
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-platform', () => {
    return process.platform;
});

// ─────────────────────────────────────────────
// IPC — File Save Dialog (for Excel exports)
// ─────────────────────────────────────────────
ipcMain.handle('save-file-dialog', async (event, defaultFilename) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultFilename,
        filters: [
            { name: 'Excel Files', extensions: ['xlsx'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    return result;
});

// ─────────────────────────────────────────────
// IPC — Open external link
// ─────────────────────────────────────────────
ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// ─────────────────────────────────────────────
// AUTO UPDATER — production only
// ─────────────────────────────────────────────
if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: 'A new version of MatSouth Vacancy Tracker is available. It will be downloaded in the background.',
        });
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded. The application will restart to install the update.',
            buttons: ['Restart Now', 'Later'],
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
}