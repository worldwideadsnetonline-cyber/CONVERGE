'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createTaskEngine}=require('../src/task-engine');
function temporary(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'converge-task-'));return {dir,file:path.join(dir,'tasks.json')};}
test('creates task plan and persists it',()=>{
 const t=temporary();const e=createTaskEngine(t.file);
 const task=e.createTask({title:'Organizar pesquisa',description:'Plano inicial',steps:[{text:'Pesquisar fontes',tool:'web_search'},{text:'Resumir'}]});
 assert.equal(task.status,'planned');assert.equal(task.steps.length,2);
 const reload=createTaskEngine(t.file);assert.equal(reload.getTask(task.id).title,'Organizar pesquisa');
 fs.rmSync(t.dir,{recursive:true,force:true});
});
test('validates task fields and step limits',()=>{
 const t=temporary(),e=createTaskEngine(t.file);
 assert.throws(()=>e.createTask({title:'',steps:[{text:'x'}]}));
 assert.throws(()=>e.createTask({title:'a',steps:[]}));
 fs.rmSync(t.dir,{recursive:true,force:true});
});
test('tracks approvals, execution, completion, and history',()=>{
 const t=temporary(),e=createTaskEngine(t.file);
 const task=e.createTask({title:'Teste',steps:[{text:'Ação protegida',tool:'calculator'}]});
 let result=e.updateStep(task.id,task.steps[0].id,'awaiting_approval');
 result=e.updateStep(task.id,task.steps[0].id,'running');
 result=e.updateStep(task.id,task.steps[0].id,'completed');
 assert.equal(result.status,'completed');assert.equal(e.listEvents(task.id).length,4);
 fs.rmSync(t.dir,{recursive:true,force:true});
});
test('rejects illegal status transitions and cancels remaining steps',()=>{
 const t=temporary(),e=createTaskEngine(t.file);
 const task=e.createTask({title:'Cancelar',steps:[{text:'Etapa 1'},{text:'Etapa 2'}]});
 assert.throws(()=>e.updateStep(task.id,task.steps[0].id,'completed'));
 const cancelled=e.cancelTask(task.id);
 assert.equal(cancelled.status,'cancelled');assert.equal(cancelled.steps[0].status,'cancelled');
 fs.rmSync(t.dir,{recursive:true,force:true});
});
