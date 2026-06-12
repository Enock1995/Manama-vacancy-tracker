const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer (React app)
// Nothing from Node.js is exposed directly — only these controlled methods

contextBridge.exposeInMainWorld('electronAPI', {

    // ── Config / Settings ──────────────────────────────────
    getConfig: (key) => ipcRenderer.invoke('get-config', key),
    setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
    getAllConfig: () => ipcRenderer.invoke('get-all-config'),

    // ── App Info ───────────────────────────────────────────
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    isElectron: true,

    // ── File System ────────────────────────────────────────
    saveFileDialog: (defaultFilename) => ipcRenderer.invoke('save-file-dialog', defaultFilename),

    // ── External Links ─────────────────────────────────────
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
});