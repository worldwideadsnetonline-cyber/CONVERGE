const { contextBridge, ipcRenderer } = require('electron');
const { pathToFileURL } = require('node:url');
contextBridge.exposeInMainWorld('djHost', {
  chooseAudio: () => ipcRenderer.invoke('dialog:audio'),
  toFileUrl: (filePath) => pathToFileURL(filePath).href
});