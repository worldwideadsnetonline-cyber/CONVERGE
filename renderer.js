const chat=document.getElementById('chat'),form=document.getElementById('form'),prompt=document.getElementById('prompt'),model=document.getElementById('model'),historyEl=document.getElementById('history');
let conversations=JSON.parse(localStorage.getItem('converge-chats')||'[]'),activeId=null;
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