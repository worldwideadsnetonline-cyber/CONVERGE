'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {calculate,executeTool,toolDefinitions}=require('../src/tools');
test('calcula expressões sem eval',()=>{assert.equal(calculate('(125 * 4) / 5').result,100);assert.equal(calculate('2^3 + 4').result,12);assert.equal(calculate('-5 + 2 * 3').result,1);});
test('rejeita divisão por zero, código e limites',()=>{assert.throws(()=>calculate('1/0'),/zero/);assert.throws(()=>calculate('process.exit()'),/caracteres/);assert.throws(()=>calculate('2^99'),/Expoente/);assert.throws(()=>calculate('1'.repeat(200)),/longa/);});
test('executa apenas ferramentas allowlist',async()=>{await assert.rejects(()=>executeTool('shell',{command:'whoami'}),/não autorizada/);assert.equal((await executeTool('calculator',{expression:'8*7'})).result,56);});
test('pesquisa exige adaptador e consulta válida',async()=>{await assert.rejects(()=>executeTool('web_search',{query:'teste'}),/indisponível/);const x=await executeTool('web_search',{query:'CONVERGE'},{searchWeb:async q=>[{title:q,url:'https://example.com',snippet:'ok'}]});assert.equal(x.results[0].title,'CONVERGE');await assert.rejects(()=>executeTool('web_search',{query:''},{searchWeb:async()=>[]}),/inválida/);});

test('create_document grava Markdown no diretório controlado e não sobrescreve',async()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'converge-doc-test-'));
 try{
  const a=await executeTool('create_document',{title:'Relatório: / Test?',content:'## Conteúdo\n\nDocumento de teste.'},{documentsPath:base});
  assert.equal(a.created,true);assert.equal(a.format,'Markdown');
  assert.ok(a.filePath.startsWith(path.join(base,'CONVERGE')));
  assert.ok(fs.readFileSync(a.filePath,'utf8').includes('Documento de teste.'));
  const b=await executeTool('create_document',{title:'Relatório: / Test?',content:'Segundo documento.'},{documentsPath:base});
  assert.notEqual(a.filePath,b.filePath);assert.ok(fs.existsSync(b.filePath));
 }finally{fs.rmSync(base,{recursive:true,force:true});}
});
test('document creation validates and stays unavailable without destination',async()=>{
 assert.ok(toolDefinitions.some(t=>t.function.name==='create_document'));
 await assert.rejects(()=>executeTool('create_document',{title:'x',content:'y'}),/Destino/);
 await assert.rejects(()=>executeTool('create_document',{title:'',content:'x'},{documentsPath:os.tmpdir()}),/Título/);
 await assert.rejects(()=>executeTool('create_document',{title:'x',content:''},{documentsPath:os.tmpdir()}),/Conteúdo/);
});
