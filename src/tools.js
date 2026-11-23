'use strict';
const fs=require('node:fs');
const path=require('node:path');
const toolDefinitions = [
 {type:'function',function:{name:'calculator',description:'Calcula expressão aritmética simples com números, parênteses e + - * / % ^.',strict:true,parameters:{type:'object',properties:{expression:{type:'string',description:'Ex.: (125 * 4) / 5'}},required:['expression'],additionalProperties:false}}},
 {type:'function',function:{name:'web_search',description:'Pesquisa na internet e devolve resultados com título, excerto e URL.',strict:true,parameters:{type:'object',properties:{query:{type:'string',description:'Consulta curta de pesquisa.'}},required:['query'],additionalProperties:false}}},
 {type:'function',function:{name:'create_document',description:'Cria um documento Markdown na pasta Documentos/CONVERGE. Só use quando o utilizador pedir um entregável/ficheiro.',strict:true,parameters:{type:'object',properties:{title:{type:'string',description:'Título do documento.'},content:{type:'string',description:'Conteúdo completo em Markdown.'}},required:['title','content'],additionalProperties:false}}}
];
function calculate(expression){
 if(typeof expression!=='string'||!expression.trim()||expression.length>160)throw new Error('Expressão inválida ou demasiado longa.');
 const tokens=expression.match(/\s*(?:(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/%^])\s*/g);
 if(!tokens||tokens.join('').replace(/\s/g,'')!==expression.replace(/\s/g,'')||tokens.length>100)throw new Error('A expressão contém caracteres não permitidos.');
 const v=tokens.map(x=>x.trim());let i=0;const peek=()=>v[i],take=()=>v[i++];
 function primary(){if(peek()==='('){take();const x=sum();if(take()!==')')throw new Error('Parênteses não correspondentes.');return x;}const t=take();if(!t||!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))throw new Error('Número esperado.');const n=Number(t);if(!Number.isFinite(n))throw new Error('Número inválido.');return n;}
 function unary(){if(peek()==='+'){take();return unary();}if(peek()==='-'){take();return -unary();}return primary();}
 function power(){const a=unary();if(peek()==='^'){take();const b=power();if(Math.abs(b)>12)throw new Error('Expoente demasiado grande.');return a**b;}return a;}
 function product(){let x=power();while(['*','/','%'].includes(peek())){const op=take(),b=power();if((op==='/'||op==='%')&&b===0)throw new Error('Não é possível dividir por zero.');x=op==='*'?x*b:op==='/'?x/b:x%b;}return x;}
 function sum(){let x=product();while(peek()==='+'||peek()==='-'){const op=take(),b=product();x=op==='+'?x+b:x-b;}return x;}
 const result=sum();if(i!==v.length||!Number.isFinite(result))throw new Error('Expressão inválida ou resultado fora dos limites.');return {expression,result};
}
function createDocument(title,content,baseDirectory){
 if(typeof title!=='string'||!title.trim()||title.length>120)throw new Error('Título de documento inválido.');
 if(typeof content!=='string'||!content.trim()||content.length>30000)throw new Error('Conteúdo inválido (máximo 30.000 caracteres).');
 if(typeof baseDirectory!=='string'||!baseDirectory)throw new Error('Destino de documentos indisponível.');
 const safe=title.trim().replace(/[<>:"/\\\\|?*\\x00-\\x1F]/g,'-').replace(/[. ]+$/,'').slice(0,100)||'Documento';
 const dir=path.join(baseDirectory,'CONVERGE');fs.mkdirSync(dir,{recursive:true});
 let file=path.join(dir,safe+'.md'),n=1;
 while(fs.existsSync(file)){file=path.join(dir,safe+' ('+(n++)+').md');}
 fs.writeFileSync(file,'# '+title.trim()+'\\n\\n'+content.trim()+'\\n',{encoding:'utf8',flag:'wx'});
 return {created:true,filePath:file,format:'Markdown'};
}
async function executeTool(name,args,adapters={}){
 if(!args||typeof args!=='object'||Array.isArray(args))throw new Error('Argumentos de ferramenta inválidos.');
 if(name==='calculator'){if(Object.keys(args).length!==1||typeof args.expression!=='string')throw new Error('Parâmetros da calculadora inválidos.');return calculate(args.expression);}
 if(name==='web_search'){if(Object.keys(args).length!==1||typeof args.query!=='string'||!args.query.trim()||args.query.length>250)throw new Error('Consulta de pesquisa inválida.');if(typeof adapters.searchWeb!=='function')throw new Error('Pesquisa web indisponível.');return {query:args.query.trim(),results:(await adapters.searchWeb(args.query.trim())).slice(0,6)};}
 if(name==='create_document'){if(Object.keys(args).length!==2||typeof args.title!=='string'||typeof args.content!=='string')throw new Error('Parâmetros de documento inválidos.');return createDocument(args.title,args.content,adapters.documentsPath);}
 throw new Error('Ferramenta não autorizada.');
}
module.exports={toolDefinitions,calculate,executeTool,createDocument};
