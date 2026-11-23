const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('converge',{
  send:(messages,model,options={})=>ipcRenderer.invoke('chat:send',{messages,model,webSearch:Boolean(options.webSearch),workspaceId:options.workspaceId}),
  search:query=>ipcRenderer.invoke('web:search',query),
  approveTool:id=>ipcRenderer.invoke('tool:approve',id),
  rejectTool:id=>ipcRenderer.invoke('tool:reject',id),
  saveKey:key=>ipcRenderer.invoke('key:save',key),
  hasKey:()=>ipcRenderer.invoke('key:has'),
  clearKey:()=>ipcRenderer.invoke('key:clear'),
  listWorkspaces:()=>ipcRenderer.invoke('workspace:list'),
  createWorkspace:input=>ipcRenderer.invoke('workspace:create',input),
  listMemories:workspaceId=>ipcRenderer.invoke('memory:list',workspaceId),
  saveMemory:input=>ipcRenderer.invoke('memory:save',input),
  deleteMemory:id=>ipcRenderer.invoke('memory:delete',id),
  exportData:()=>ipcRenderer.invoke('data:export')
});