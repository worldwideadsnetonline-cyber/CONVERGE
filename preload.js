const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('converge',{
  send:(messages,model,options={})=>ipcRenderer.invoke('chat:send',{messages,model,webSearch:Boolean(options.webSearch)}),
  search:query=>ipcRenderer.invoke('web:search',query),
  saveKey:key=>ipcRenderer.invoke('key:save',key),
  hasKey:()=>ipcRenderer.invoke('key:has'),
  clearKey:()=>ipcRenderer.invoke('key:clear')
});