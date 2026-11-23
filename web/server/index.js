const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'workspace.json');
const API_KEY = process.env.OPENAI_API_KEY || '';
const ADMIN_PASSWORD = process.env.CONVERGE_ADMIN_PASSWORD || '';
const sessions = new Map();
const limits = new Map();

app.disable('x-powered-by');
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:");next()});
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'..','public')));
function readStore(){try{const d=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));d.projects||=[{id:'default',name:'Workspace',memories:[]}];d.conversations||=[];return d}catch{return{projects:[{id:'default',name:'Workspace',memories:[]}],conversations:[]}}}
function writeStore(d){fs.mkdirSync(DATA_DIR,{recursive:true});const tmp=DATA_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(d,null,2));fs.renameSync(tmp,DATA_FILE)}
function cookieSid(req){return req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('converge_session='))?.slice('converge_session='.length)}
function session(req){const sid=cookieSid(req);return sid&&sessions.get(sid)}
function auth(req,res,next){if(!ADMIN_PASSWORD)return res.status(503).json({error:'Website password is not configured. Set CONVERGE_ADMIN_PASSWORD on the host.'});if(!session(req))return res.status(401).json({error:'Sign in to CONVERGE.'});next()}
app.use('/api', (req,res,next)=>{const key=req.ip||'unknown',now=Date.now(),b=limits.get(key)||{start:now,n:0};if(now-b.start>60000){b.start=now;b.n=0}b.n++;limits.set(key,b);if(b.n>90)return res.status(429).json({error:'Rate limit reached. Please wait a minute.'});next()});
app.get('/api/health',(_req,res)=>res.json({ok:true,aiConfigured:Boolean(API_KEY),authConfigured:Boolean(ADMIN_PASSWORD),authenticated:false}));
app.post('/api/login',(req,res)=>{if(!ADMIN_PASSWORD)return res.status(503).json({error:'Set CONVERGE_ADMIN_PASSWORD on the server.'});const supplied=String(req.body?.password||'');const a=Buffer.from(supplied),b=Buffer.from(ADMIN_PASSWORD);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(401).json({error:'Password incorrect.'});const sid=crypto.randomBytes(32).toString('hex');sessions.set(sid,{createdAt:Date.now()});res.setHeader('Set-Cookie',`converge_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV==='production'?'; Secure':''}`);res.json({ok:true})});
app.post('/api/logout',(req,res)=>{const sid=cookieSid(req);if(sid)sessions.delete(sid);res.setHeader('Set-Cookie','converge_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');res.json({ok:true})});
app.get('/api/auth/status',(req,res)=>res.json({authenticated:Boolean(session(req)),authConfigured:Boolean(ADMIN_PASSWORD),aiConfigured:Boolean(API_KEY)}));
app.get('/api/projects',auth,(_req,res)=>res.json(readStore().projects));
app.post('/api/projects',auth,(req,res)=>{const name=String(req.body?.name||'').trim();if(!name||name.length>80)return res.status(400).json({error:'Project name must be 1–80 characters.'});const d=readStore(),p={id:crypto.randomUUID(),name,memories:[]};d.projects.push(p);writeStore(d);res.status(201).json(p)});
app.get('/api/memory/:projectId',auth,(req,res)=>{const p=readStore().projects.find(p=>p.id===req.params.projectId);if(!p)return res.status(404).json({error:'Project not found'});res.json(p.memories||[])});
app.post('/api/memory/:projectId',auth,(req,res)=>{const title=String(req.body?.title||'').trim(),content=String(req.body?.content||'').trim();if(!title||!content||title.length>120||content.length>4000)return res.status(400).json({error:'Enter a title and content within limits.'});const d=readStore(),p=d.projects.find(p=>p.id===req.params.projectId);if(!p)return res.status(404).json({error:'Project not found'});p.memories||=[];const m={id:crypto.randomUUID(),title,content,createdAt:new Date().toISOString()};p.memories.unshift(m);writeStore(d);res.status(201).json(m)});
app.delete('/api/memory/:projectId/:memoryId',auth,(req,res)=>{const d=readStore(),p=d.projects.find(p=>p.id===req.params.projectId);if(!p)return res.status(404).json({error:'Project not found'});p.memories=(p.memories||[]).filter(m=>m.id!==req.params.memoryId);writeStore(d);res.json({ok:true})});
app.get('/api/conversations',auth,(req,res)=>res.json(readStore().conversations.filter(c=>c.projectId===String(req.query.projectId||'default')).slice(-50)));
app.post('/api/chat',auth,async(req,res)=>{const message=String(req.body?.message||'').trim();if(!message||message.length>20000)return res.status(400).json({error:'Message is empty or too long.'});if(!API_KEY)return res.status(503).json({error:'AI is not configured. Set OPENAI_API_KEY on the server.'});const projectId=String(req.body?.projectId||'default'),d=readStore(),p=d.projects.find(p=>p.id===projectId);if(!p)return res.status(404).json({error:'Project not found'});const mem=(p.memories||[]).slice(0,10).map(m=>'- '+m.title+': '+m.content).join('\n');const model=['gpt-4o-mini','gpt-4o'].includes(req.body?.model)?req.body.model:'gpt-4o-mini';try{const upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model,input:[{role:'system',content:`You are CONVERGE, a collaborative human-AI workspace. Be honest about capabilities and use web search when helpful. Project: ${p.name}. Project memories:\n${mem||'(none)'}`},{role:'user',content:message}],tools:[{type:'web_search'}],tool_choice:'auto'})});const payload=await upstream.json();if(!upstream.ok)return res.status(upstream.status).json({error:payload?.error?.message||'AI request failed'});const answer=(payload.output||[]).flatMap(x=>x.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');d.conversations.push({id:crypto.randomUUID(),projectId,message,answer,model,createdAt:new Date().toISOString()});writeStore(d);res.json({answer:answer||'No text returned.'})}catch(e){res.status(502).json({error:'AI gateway failed: '+e.message})}});
app.listen(PORT,()=>console.log(`CONVERGE Web listening on port ${PORT}`));
