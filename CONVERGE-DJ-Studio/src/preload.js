const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('node:url');
contextBridge.exposeInMainWorld('djHost', {
  chooseAudio: () => ipcRenderer.invoke('dialog:audio'),
  readAudio: (filePath) => ipcRenderer.invoke('audio:read', filePath),
  toFileUrl: (filePath) => pathToFileURL(filePath).href
});