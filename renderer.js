const chat=document.getElementById('chat'),form=document.getElementById('form'),prompt=document.getElementById('prompt'),model=document.getElementById('model'),historyEl=document.getElementById('history');
let conversations=JSON.parse(localStorage.getItem('converge-chats')||'[]'),activeId=null,workspaces=[];\nconst activeWorkspace=document.getElementById('activeWorkspace');\nasync function loadWorkspaces(){workspaces=await window.converge.listWorkspaces();const saved=localStorage.getItem('converge-active-workspace');activeWorkspace.innerHTML='';workspaces.forEach(w=>{const o=document.createElement('option');o.value=w.id;o.textContent=w.name;activeWorkspace.appendChild(o);});if(workspaces.some(w=>w.id===saved))activeWorkspace.value=saved;else if(workspaces[0])activeWorkspace.value=workspaces[0].id;localStorage.setItem('converge-active-workspace',activeWorkspace.value);}\nactiveWorkspace.addEventListener('change',()=>{localStorage.setItem('converge-active-workspace',activeWorkspace.value);});
function persist(){localStorage.setItem('converge-chats',JSON.stringify(conversations));renderHistory();}
function active(){return conversations.find(c=>c.id===activeId);}
function renderHistory(){historyEl.innerHTML='';conversations.slice().reverse().forEach(c=>{const b=document.createElement('button');b.textContent=c.title||'Nova conversa';b.onclick=()=>openChat(c.id);historyEl.appendChild(b);});}
function openChat(id){activeId=id;chat.innerHTML='';active().messages.forEach(m=>addMessage(m.role,m.content));}
function addMessage(role,text){const d=document.createElement('div');d.className='message '+role;d.textContent=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;}
function newChat(){activeId=null;chat.innerHTML='<div id="welcome" class="welcome"><div class="welcome-icon">✦</div><h1>Em que posso ajudar?</h1><p>Converse, explore ideias e crie algo novo.</p></div>';}
form.addEventListener('submit',async e=>{
  e.preventDefault();const text=prompt.value.trim();if(!text)return;prompt.value='';document.getElementById('welcome')?.remove();
  if(!active()){activeId=String(Date.now());conversations.push({id:activeId,title:text.slice(0,40),messages:[]});}
  const c=active();c.messages.push({role:'user',content:text});addMessage('user',text);
  const wait=addMessage('assistant','A pensar…');
  try{
    const answer=await window.converge.send(c.messages,model.value,{webSearch:document.getElementById('webSearch').checked});
    wait.textContent=answer;c.messages.push({role:'assistant',content:answer});persist();
  }catch(err){
    wait.textContent='Erro: '+err.message;
    if(err.message.includes('chave API OpenAI ainda não foi configurada')){document.getElementById('settings').classList.remove('hidden');document.getElementById('apiKey').focus();}
  }
  chat.scrollTop=chat.scrollHeight;
});
document.getElementById('newChat').onclick=newChat;
const panel=document.getElementById('settings');
document.getElementById('settingsBtn').onclick=()=>panel.classList.remove('hidden');
document.getElementById('closeSettings').onclick=()=>panel.classList.add('hidden');
document.getElementById('saveKey').onclick=async()=>{
  const k=document.getElementById('apiKey').value.trim();if(!k)return;
  const s=document.getElementById('settingsStatus');
  try{await window.converge.saveKey(k);s.textContent='Chave guardada com segurança neste computador.';document.getElementById('apiKey').value='';}
  catch(e){s.textContent='Erro: '+e.message;}
};
document.getElementById('clearKey').onclick=async()=>{await window.converge.clearKey();document.getElementById('settingsStatus').textContent='Chave removida.';};
document.getElementById('testSearch').onclick=async()=>{
  const status=document.getElementById('settingsStatus');const query=document.getElementById('searchTestQuery').value.trim()||'notícias de tecnologia';
  status.textContent='A testar ligação à internet…';
  try{const results=await window.converge.search(query);status.textContent='Pesquisa funcional. '+results.length+' resultados encontrados. Primeiro: '+results[0].title+' — '+results[0].url;}
  catch(e){status.textContent='Falha na pesquisa: '+e.message;}
};
renderHistory();
const memoryPanel=document.getElementById('memoryPanel');
const workspaceSelect=document.getElementById('workspaceSelect');
const memoryList=document.getElementById('memoryList');
let editingMemoryId=null;
document.getElementById('memoryBtn').onclick=()=>{memoryPanel.classList.remove('hidden');refreshMemory();};
document.getElementById('closeMemory').onclick=()=>memoryPanel.classList.add('hidden');
async function refreshMemory(){
  const status=document.getElementById('memoryStatus');
  try{
    const spaces=await window.converge.listWorkspaces();
    const selected=activeWorkspace.value||workspaceSelect.value;
    workspaceSelect.innerHTML='';
    spaces.forEach(w=>{const o=document.createElement('option');o.value=w.id;o.textContent=w.name;workspaceSelect.appendChild(o);});
    if(spaces.some(w=>w.id===selected))workspaceSelect.value=selected;else if(activeWorkspace.value)workspaceSelect.value=activeWorkspace.value;
    const memories=await window.converge.listMemories(workspaceSelect.value);
    memoryList.innerHTML='';
    memories.forEach(m=>{
      const card=document.createElement('article');card.className='memory-item';
      const title=document.createElement('strong');title.textContent=m.title;
      const body=document.createElement('p');body.textContent=m.content;
      const actions=document.createElement('div');actions.className='memory-actions';
      const edit=document.createElement('button');edit.className='secondary';edit.textContent='Editar';edit.onclick=()=>{editingMemoryId=m.id;document.getElementById('memoryTitle').value=m.title;document.getElementById('memoryContent').value=m.content;};
      const remove=document.createElement('button');remove.className='secondary';remove.textContent='Apagar';remove.onclick=async()=>{if(confirm('Apagar esta memória?')){await window.converge.deleteMemory(m.id);refreshMemory();}};
      actions.append(edit,remove);card.append(title,body,actions);memoryList.appendChild(card);
    });
    status.textContent=memories.length+' memória(s) neste espaço.';
  }catch(e){status.textContent='Erro: '+e.message;}
}
workspaceSelect.addEventListener('change',refreshMemory);
document.getElementById('createWorkspace').onclick=async()=>{
  const field=document.getElementById('workspaceName');
  try{await window.converge.createWorkspace({name:field.value});field.value='';await loadWorkspaces();workspaceSelect.value=activeWorkspace.value;await refreshMemory();document.getElementById('memoryStatus').textContent='Projeto criado.';}
  catch(e){document.getElementById('memoryStatus').textContent='Erro: '+e.message;}
};
document.getElementById('saveMemory').onclick=async()=>{
  const title=document.getElementById('memoryTitle'),content=document.getElementById('memoryContent');
  try{await window.converge.saveMemory({id:editingMemoryId||undefined,title:title.value,content:content.value,workspaceId:workspaceSelect.value});editingMemoryId=null;title.value='';content.value='';await refreshMemory();document.getElementById('memoryStatus').textContent='Memória guardada neste computador.';}
  catch(e){document.getElementById('memoryStatus').textContent='Erro: '+e.message;}
};
document.getElementById('exportData').onclick=async()=>{
  try{const data=await window.converge.exportData();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='converge-dados.json';a.click();URL.revokeObjectURL(url);document.getElementById('memoryStatus').textContent='Exportação iniciada.';}
  catch(e){document.getElementById('memoryStatus').textContent='Erro: '+e.message;}
};
