const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  ensureServer: () => ipcRenderer.invoke('ensure-server'),
  saveWav: (arrayBuffer) => ipcRenderer.invoke('save-wav', arrayBuffer),
  onLog: (cb) => ipcRenderer.on('server-log', (_e, line) => cb(line)),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (patch) => ipcRenderer.invoke('save-settings', patch),
  pickDirectory: (title) => ipcRenderer.invoke('pick-directory', title),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  appVersion: () => ipcRenderer.invoke('app-version'),
  isPackaged: () => ipcRenderer.invoke('app-is-packaged'),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_e, info) => cb(info)),
});
