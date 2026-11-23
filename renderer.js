const chat=document.getElementById('chat'),form=document.getElementById('form'),prompt=document.getElementById('prompt'),model=document.getElementById('model'),historyEl=document.getElementById('history');
let conversations=JSON.parse(localStorage.getItem('converge-chats')||'[]'),activeId=null,workspaces=[];
const activeWorkspace=document.getElementById('activeWorkspace');
async function loadWorkspaces(){workspaces=await window.converge.listWorkspaces();const saved=localStorage.getItem('converge-active-workspace');activeWorkspace.innerHTML='';workspaces.forEach(w=>{const o=document.createElement('option');o.value=w.id;o.textContent=w.name;activeWorkspace.appendChild(o);});if(workspaces.some(w=>w.id===saved))activeWorkspace.value=saved;else if(workspaces[0])activeWorkspace.value=workspaces[0].id;localStorage.setItem('converge-active-workspace',activeWorkspace.value);}
activeWorkspace.addEventListener('change',()=>{localStorage.setItem('converge-active-workspace',activeWorkspace.value);});
function persist(){localStorage.setItem('converge-chats',JSON.stringify(conversations));renderHistory();}
function active(){return conversations.find(c=>c.id===activeId);}
function renderHistory(){historyEl.innerHTML='';conversations.slice().reverse().forEach(c=>{const b=document.createElement('button');b.textContent=c.title||'Nova conversa';b.onclick=()=>openChat(c.id);historyEl.appendChild(b);});}
function openChat(id){activeId=id;chat.innerHTML='';active().messages.forEach(m=>addMessage(m.role,m.content));}
function addMessage(role,text){const d=document.createElement('div');d.className='message '+role;d.textContent=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d;}
function showToolApproval(message,pending,c){
 const card=document.createElement('div');card.className='tool-approval';
 const title=document.createElement('strong');title.textContent='Aprovação necessária';
 const description=document.createElement('p');description.textContent=pending.description;
 const note=document.createElement('small');note.textContent='Nada será executado sem a tua autorização. A proposta expira em cinco minutos.';
 const actions=document.createElement('div');actions.className='tool-approval-actions';
 const approve=document.createElement('button');approve.className='primary';approve.textContent='Aprovar e executar';
 const reject=document.createElement('button');reject.className='secondary';reject.textContent='Recusar';
 approve.onclick=async()=>{approve.disabled=true;reject.disabled=true;message.textContent='A executar a ação aprovada…';try{const result=await window.converge.approveTool(pending.id);message.textContent=result.answer+(result.memoryCount?'\\n\\n✧ Contexto aplicado: '+result.memoryCount+' memória(s).':'');c.messages.push({role:'assistant',content:result.answer});persist();}catch(e){message.textContent='Erro ao executar a ação aprovada: '+e.message;}card.remove();};
 reject.onclick=async()=>{await window.converge.rejectTool(pending.id);message.textContent='Ação recusada. Nada foi executado.';c.messages.push({role:'assistant',content:'Ação recusada pelo utilizador. Nada foi executado.'});persist();card.remove();};
 actions.append(approve,reject);card.append(title,description,note,actions);message.after(card);chat.scrollTop=chat.scrollHeight;
}
function newChat(){activeId=null;chat.innerHTML='<div id="welcome" class="welcome"><div class="welcome-icon">✦</div><h1>Em que posso ajudar?</h1><p>Converse, explore ideias e crie algo novo.</p></div>';}
form.addEventListener('submit',async e=>{
  e.preventDefault();const text=prompt.value.trim();if(!text)return;prompt.value='';document.getElementById('welcome')?.remove();
  if(!active()){activeId=String(Date.now());conversations.push({id:activeId,title:text.slice(0,40),messages:[]});}
  const c=active();c.messages.push({role:'user',content:text});addMessage('user',text);
  const wait=addMessage('assistant','A pensar…');
  try{
    const result=await window.converge.send(c.messages,model.value,{webSearch:document.getElementById('webSearch').checked,workspaceId:activeWorkspace.value});
    const answer=typeof result==='string'?result:result.answer;
    if(result.pendingAction){wait.textContent=answer;showToolApproval(wait,result.pendingAction,c);return;}
    wait.textContent=answer+(result.memoryCount?'\\n\\n✧ Contexto aplicado: '+result.memoryCount+' memória(s) relevante(s) do projeto ativo.':'');c.messages.push({role:'assistant',content:answer});persist();
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
  const s=document.getElementById('settingsStatus'),button=document.getElementById('saveKey');
  button.disabled=true;s.textContent='A validar chave com a OpenAI…';
  try{
    const result=await window.converge.saveKey(k);
    document.getElementById('apiKey').value='';
    s.textContent=result.modelAvailable?'✓ Chave validada, guardada cifrada. CONVERGE está conectado e o modelo GPT-4o mini está disponível.':'✓ Chave validada e guardada cifrada. Atenção: o modelo GPT-4o mini não apareceu na lista de modelos autorizados; verifica o acesso ao modelo.';
  }catch(e){s.textContent='✕ A chave não foi guardada: '+e.message;}
  finally{button.disabled=false;}
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
workspaceSelect.addEventListener('change',()=>{activeWorkspace.value=workspaceSelect.value;localStorage.setItem('converge-active-workspace',activeWorkspace.value);refreshMemory();});
document.getElementById('createWorkspace').onclick=async()=>{
  const field=document.getElementById('workspaceName');
  try{const created=await window.converge.createWorkspace({name:field.value});field.value='';await loadWorkspaces();activeWorkspace.value=created.id;localStorage.setItem('converge-active-workspace',created.id);workspaceSelect.value=created.id;await refreshMemory();document.getElementById('memoryStatus').textContent='Projeto criado.';}
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

const taskPanel=document.getElementById('taskPanel');
document.getElementById('taskBtn').onclick=()=>{taskPanel.classList.remove('hidden');refreshTasks();};
document.getElementById('closeTasks').onclick=()=>taskPanel.classList.add('hidden');
function showTaskApproval(pending,taskId,stepId){
 const card=document.createElement('article');card.className='task-item tool-approval';
 const title=document.createElement('strong');title.textContent='Aprovação necessária — execução de etapa';
 const desc=document.createElement('p');desc.textContent=pending.description;
 const note=document.createElement('small');note.textContent='A ferramenta só será executada após aprovação. Proposta expira em 5 minutos.';
 const approve=document.createElement('button');approve.className='primary';approve.textContent='Aprovar e executar';
 const reject=document.createElement('button');reject.className='secondary';reject.textContent='Recusar';
 approve.onclick=async()=>{approve.disabled=true;reject.disabled=true;desc.textContent='A executar ferramenta aprovada…';try{const result=await window.converge.approveTaskStep(pending.id);desc.textContent='Concluído: '+result.answer;document.getElementById('taskStatus').textContent='Etapa concluída com resultado guardado.';refreshTasks();}catch(err){desc.textContent='Erro: '+err.message;document.getElementById('taskStatus').textContent=desc.text;}};
 reject.onclick=async()=>{await window.converge.rejectTaskStep(pending.id);desc.textContent='Ação recusada; nenhuma ferramenta executada.';reject.disabled=true;approve.disabled=true;};
 card.append(title,desc,note,approve,reject);document.getElementById('taskList').prepend(card);
}
async function refreshTasks(){
 const list=document.getElementById('taskList'),status=document.getElementById('taskStatus');list.innerHTML='';
 try{const tasks=await window.converge.listTasks();status.textContent=tasks.length+' tarefa(s) guardada(s).';
 tasks.forEach(t=>{const card=document.createElement('article');card.className='task-item';const title=document.createElement('strong');title.textContent=t.title+' · '+t.status;const desc=document.createElement('p');desc.textContent=t.description;card.append(title,desc);
 t.steps.forEach(s=>{const line=document.createElement('div');line.className='task-step';const label=document.createElement('span');label.textContent=s.order+'. '+s.text+' ['+s.status+']';line.append(label);
 if(s.status==='awaiting_approval'){const reset=document.createElement('button');reset.className='secondary';reset.textContent='Retomar etapa';reset.onclick=async()=>{await window.converge.updateTaskStep(t.id,s.id,'pending','Proposta anterior perdida; etapa retomada.');refreshTasks();};line.append(reset);}
 if(s.status==='pending'||s.status==='failed'){const run=document.createElement('button');run.className='primary';run.textContent='Executar com IA';run.onclick=async()=>{run.disabled=true;status.textContent='CONVERGE a executar etapa…';try{const out=await window.converge.runTaskStep(t.id,s.id,model.value);if(out.status==='awaiting_approval'){showTaskApproval(out.pending,t.id,s.id);}else{status.textContent='Etapa concluída pela IA.';refreshTasks();}}catch(err){status.textContent='Erro na execução: '+err.message;run.disabled=false;}};line.append(run);}
 else if(s.status==='running'){const done=document.createElement('button');done.className='primary';done.textContent='Concluir manualmente';done.onclick=async()=>{await window.converge.updateTaskStep(t.id,s.id,'completed');refreshTasks();};line.append(done);}
 if(s.result){const result=document.createElement('p');result.className='muted';result.textContent='Resultado: '+s.result;line.append(result);}
 card.append(line);});
 list.appendChild(card);});
 }catch(e){status.textContent='Erro ao carregar: '+e.message;}
}
document.getElementById('generateTaskPlan').onclick=async()=>{
 const title=document.getElementById('taskTitle'),description=document.getElementById('taskDescription'),steps=document.getElementById('taskSteps'),status=document.getElementById('taskStatus'),button=document.getElementById('generateTaskPlan');
 if(!title.value.trim()){status.textContent='Escreva o título da tarefa antes de gerar etapas.';title.focus();return;}
 button.disabled=true;status.textContent='A IA está a estruturar as etapas…';
 try{const result=await window.converge.planTask({title:title.value,description:description.value,model:model.value});steps.value=result.steps.join('\n');status.textContent='Etapas sugeridas pela IA. Revise, edite e depois clique em Criar plano.';}
 catch(e){status.textContent='Não foi possível gerar etapas: '+e.message;}
 finally{button.disabled=false;}
};
document.getElementById('createTask').onclick=async()=>{
 const title=document.getElementById('taskTitle'),description=document.getElementById('taskDescription'),steps=document.getElementById('taskSteps'),status=document.getElementById('taskStatus');
 const rows=steps.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 try{await window.converge.createTask({title:title.value,description:description.value,steps:rows.map(text=>({text}))});title.value='';description.value='';steps.value='';status.textContent='Plano criado e guardado localmente.';refreshTasks();}
 catch(e){status.textContent='Erro: '+e.message;}
};
