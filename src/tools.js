'use strict';
const fs=require('node:fs');
const path=require('node:path');
const toolDefinitions = [
 {type:'function',function:{name:'calculator',description:'Calcula expressão aritmética simples com números, parênteses e + - * / % ^.',strict:true,parameters:{type:'object',properties:{expression:{type:'string',description:'Ex.: (125 * 4) / 5'}},required:['expression'],additionalProperties:false}}},
 {type:'function',function:{name:'web_search',description:'Pesquisa na internet e devolve resultados com título, excerto e URL. Use para descobrir fontes.',strict:true,parameters:{type:'object',properties:{query:{type:'string',description:'Consulta curta de pesquisa.'}},required:['query'],additionalProperties:false}}},
 {type:'function',function:{name:'web_open',description:'Abre e lê uma página pública da Internet. Use URLs encontrados na pesquisa. Não acede a endereços privados, locais ou de rede interna.',strict:true,parameters:{type:'object',properties:{url:{type:'string',description:'URL pública http ou https de uma fonte.'}},required:['url'],additionalProperties:false}}},
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
 const safe=Array.from(title.trim()).map(ch=>{const code=ch.charCodeAt(0);return code<32||'<>:"/\\|?*'.includes(ch)?'-':ch;}).join('').replace(/[. ]+$/,'').slice(0,100)||'Documento';
 const dir=path.join(baseDirectory,'CONVERGE');fs.mkdirSync(dir,{recursive:true});
 let file=path.join(dir,safe+'.md'),n=1;
 while(fs.existsSync(file)){file=path.join(dir,safe+' ('+(n++)+').md');}
 fs.writeFileSync(file,'# '+title.trim()+'\\n\\n'+content.trim()+'\\n',{encoding:'utf8',flag:'wx'});
 return {created:true,filePath:file,format:'Markdown'};
}
function isPublicHostname(host){
 const h=String(host||'').toLowerCase().replace(/^\[|\]$/g,'');
 if(!h||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal'))return false;
 if(/^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\.|^0\.|^224\.|^255\./.test(h))return false;
 if(h==='::1'||h==='::'||h.startsWith('fe80:')||h.startsWith('fc')||h.startsWith('fd')||h.startsWith('ff'))return false;
 if(/^::ffff:(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(h))return false;
 return true;
}
function cleanHtmlToText(html){
 return String(html||'').replace(/<(script|style|noscript|svg|iframe|form)\b[\s\S]*?<\/\1>/gi,' ')
 .replace(/<\/(?:p|div|article|section|li|h[1-6]|br|tr)>/gi,'\n')
 .replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
 .replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
async function openWebPage(url){
 const dns=require('node:dns').promises;
 let current;
 try{current=new URL(url);}catch{throw new Error('URL inválida.');}
 for(let hop=0;hop<=4;hop++){
  if(!['http:','https:'].includes(current.protocol)||!isPublicHostname(current.hostname)||current.username||current.password)throw new Error('URL não permitida: apenas páginas públicas http/https.');
  try{
   const resolved=await dns.lookup(current.hostname,{all:true});
   if(!resolved.length||resolved.some(x=>!isPublicHostname(x.address)))throw new Error('Destino de rede privada bloqueado.');
  }catch(e){if(e.message==='Destino de rede privada bloqueado.')throw e;throw new Error('Não foi possível validar o domínio público.');}
  const response=await fetch(current.toString(),{headers:{'User-Agent':'Mozilla/5.0 (compatible; CONVERGE/1.0)','Accept':'text/html,text/plain,application/xhtml+xml'},signal:AbortSignal.timeout(18000),redirect:'manual'});
  if([301,302,303,307,308].includes(response.status)){
   if(hop===4)throw new Error('A página excedeu o limite de redirecionamentos.');
   const loc=response.headers.get('location');if(!loc)throw new Error('Redirecionamento sem destino.');
   current=new URL(loc,current);continue;
  }
  if(!response.ok)throw new Error('Falha ao abrir página (HTTP '+response.status+').');
  const type=response.headers.get('content-type')||'';
  if(!/text\/(html|plain)|application\/(xhtml\+xml|xml)/i.test(type))throw new Error('A página não devolveu conteúdo de texto legível.');
  const raw=(await response.text()).slice(0,180000);
  const title=(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||current.hostname;
  const text=type.includes('text/plain')?raw:cleanHtmlToText(raw);
  return {url:current.toString(),title:cleanHtmlToText(title).slice(0,250),content:text.slice(0,16000),truncated:text.length>16000};
 }
 throw new Error('Não foi possível abrir a página.');
}
async function executeTool(name,args,adapters={}){
 if(!args||typeof args!=='object'||Array.isArray(args))throw new Error('Argumentos de ferramenta inválidos.');
 if(name==='calculator'){if(Object.keys(args).length!==1||typeof args.expression!=='string')throw new Error('Parâmetros da calculadora inválidos.');return calculate(args.expression);}
 if(name==='web_search'){if(Object.keys(args).length!==1||typeof args.query!=='string'||!args.query.trim()||args.query.length>250)throw new Error('Consulta de pesquisa inválida.');if(typeof adapters.searchWeb!=='function')throw new Error('Pesquisa web indisponível.');return {query:args.query.trim(),results:(await adapters.searchWeb(args.query.trim())).slice(0,6)};}
 if(name==='web_open'){if(Object.keys(args).length!==1||typeof args.url!=='string'||args.url.length>2000)throw new Error('URL inválida.');if(typeof adapters.openWeb!=='function')throw new Error('Leitura web indisponível.');return await adapters.openWeb(args.url);}
 if(name==='create_document'){if(Object.keys(args).length!==2||typeof args.title!=='string'||typeof args.content!=='string')throw new Error('Parâmetros de documento inválidos.');return createDocument(args.title,args.content,adapters.documentsPath);}
 throw new Error('Ferramenta não autorizada.');
}
module.exports={toolDefinitions,calculate,executeTool,createDocument,isPublicHostname,cleanHtmlToText,openWebPage};
