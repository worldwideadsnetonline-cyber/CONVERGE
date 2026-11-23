'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const TASK_STATUSES = new Set(['planned','running','completed','failed','cancelled']);
const STEP_STATUSES = new Set(['pending','awaiting_approval','running','completed','failed','cancelled']);
const MAX_TASKS = 500, MAX_STEPS = 30, MAX_EVENTS = 1000;
function textField(value,label,max) {
  if(typeof value!=='string') throw new Error(label+' inválido.');
  const s=value.trim();
  if(!s || s.length>max) throw new Error(label+' deve ter entre 1 e '+max+' caracteres.');
  return s;
}
function createTaskEngine(filePath) {
  let data;
  function init(){ return {schemaVersion:1,tasks:[],events:[]}; }
  function load(){
    if(data) return;
    try {
      const d=JSON.parse(fs.readFileSync(filePath,'utf8'));
      if(d.schemaVersion!==1 || !Array.isArray(d.tasks) || !Array.isArray(d.events)) throw new Error('Estrutura desconhecida.');
      data=d;
    } catch(e) {
      if(e.code!=='ENOENT') throw new Error('Não foi possível carregar tarefas: '+e.message);
      data=init(); persist();
    }
  }
  function persist(){
    fs.mkdirSync(path.dirname(filePath),{recursive:true});
    const tmp=filePath+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify(data,null,2),{encoding:'utf8',mode:0o600});
    fs.renameSync(tmp,filePath);
  }
  function copy(x){return JSON.parse(JSON.stringify(x));}
  function event(taskId,type,details=''){
    data.events.push({id:randomUUID(),taskId,type,details:String(details).slice(0,500),at:new Date().toISOString()});
    if(data.events.length>MAX_EVENTS) data.events=data.events.slice(-MAX_EVENTS);
  }
  function createTask(input){
    load();
    if(data.tasks.length>=MAX_TASKS) throw new Error('Limite de tarefas arquivadas atingido.');
    const title=textField(input?.title,'Título da tarefa',120);
    const description=typeof input.description==='string'?input.description.trim().slice(0,2000):'';
    if(!Array.isArray(input.steps) || input.steps.length<1 || input.steps.length>MAX_STEPS) throw new Error('A tarefa precisa ter de 1 a '+MAX_STEPS+' passos.');
    const now=new Date().toISOString();
    const task={id:randomUUID(),title,description,status:'planned',steps:input.steps.map((s,i)=>({id:randomUUID(),order:i+1,text:textField(s?.text,'Passo '+(i+1),500),status:'pending',tool:s?.tool||null,createdAt:now,updatedAt:now})),createdAt:now,updatedAt:now};
    data.tasks.unshift(task); event(task.id,'task_created',title); persist(); return copy(task);
  }
  function listTasks(){load();return copy(data.tasks);}
  function getTask(id){load();const t=data.tasks.find(t=>t.id===id);return t?copy(t):null;}
  function updateStep(taskId,stepId,status,details=''){
    load();
    if(!STEP_STATUSES.has(status)) throw new Error('Estado do passo inválido.');
    const t=data.tasks.find(t=>t.id===taskId); if(!t) throw new Error('Tarefa não encontrada.');
    if(t.status==='cancelled' || t.status==='completed') throw new Error('Tarefa terminal não pode ser alterada.');
    const s=t.steps.find(s=>s.id===stepId); if(!s) throw new Error('Passo não encontrado.');
    const transitions={pending:['awaiting_approval','running','cancelled'],awaiting_approval:['running','cancelled'],running:['completed','failed','cancelled'],completed:[],failed:['pending','cancelled'],cancelled:[]};
    if(!transitions[s.status]?.includes(status)) throw new Error('Transição de estado não permitida: '+s.status+' → '+status);
    const now=new Date().toISOString(); s.status=status;s.updatedAt=now;
    t.status=status==='failed'?'failed':status==='cancelled'?'cancelled':'running';t.updatedAt=now;
    if(t.steps.every(x=>x.status==='completed')) t.status='completed';
    event(taskId,'step_'+status,details||s.text);persist();return copy(t);
  }
  function cancelTask(taskId,reason='Cancelado pelo utilizador'){
    load();const t=data.tasks.find(t=>t.id===taskId);if(!t)throw new Error('Tarefa não encontrada.');
    if(['completed','cancelled'].includes(t.status)) return copy(t);
    const now=new Date().toISOString();t.status='cancelled';t.updatedAt=now;
    for(const s of t.steps) if(!['completed','failed','cancelled'].includes(s.status)){s.status='cancelled';s.updatedAt=now;}
    event(taskId,'task_cancelled',reason);persist();return copy(t);
  }
  function listEvents(taskId){load();return copy(data.events.filter(e=>!taskId||e.taskId===taskId).slice().reverse());}
  function exportData(){load();return copy(data);}
  return {createTask,listTasks,getTask,updateStep,cancelTask,listEvents,exportData};
}
module.exports={createTaskEngine,TASK_STATUSES,STEP_STATUSES};
