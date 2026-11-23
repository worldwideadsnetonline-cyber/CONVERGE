const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'workspace.json');
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function readStore() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { projects: [{ id: 'default', name: 'Workspace', memories: [] }], conversations: [] }; }
}
function writeStore(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}
app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) }));
app.get('/api/projects', (_req, res) => res.json(readStore().projects));
app.post('/api/projects', (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name || name.length > 80) return res.status(400).json({ error: 'Project name must be 1–80 characters.' });
  const data = readStore(); const project = { id: crypto.randomUUID(), name, memories: [] };
  data.projects.push(project); writeStore(data); res.status(201).json(project);
});
app.get('/api/memory/:projectId', (req, res) => {
  const project = readStore().projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project.memories || []);
});
app.post('/api/memory/:projectId', (req, res) => {
  const title = String(req.body?.title || '').trim(), content = String(req.body?.content || '').trim();
  if (!title || !content || title.length > 120 || content.length > 4000) return res.status(400).json({ error: 'Please provide a title and memory (within limits).' });
  const data = readStore(), project = data.projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  project.memories ||= []; const memory = { id: crypto.randomUUID(), title, content, createdAt: new Date().toISOString() };
  project.memories.unshift(memory); writeStore(data); res.status(201).json(memory);
});
app.delete('/api/memory/:projectId/:memoryId', (req, res) => {
  const data = readStore(), project = data.projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  project.memories = (project.memories || []).filter(m => m.id !== req.params.memoryId);
  writeStore(data); res.json({ ok: true });
});
app.post('/api/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message || message.length > 20000) return res.status(400).json({ error: 'Message is empty or too long.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured on the server yet. Add OPENAI_API_KEY to server environment.' });
  const projectId = String(req.body?.projectId || 'default');
  const data = readStore(), project = data.projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const memoryText = (project.memories || []).slice(0, 5).map(m => `- ${m.title}: ${m.content}`).join('\n');
  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: req.body?.model || 'gpt-4o-mini', input: [
        { role: 'system', content: `You are CONVERGE, a thoughtful collaborative AI workspace. Be honest about capabilities; don't claim to browse or run tools unless tools are actually available. Active project: ${project.name}. Project memories:\n${memoryText || '(none)'}` },
        { role: 'user', content: message }
      ] })
    });
    const payload = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: payload?.error?.message || 'AI request failed.' });
    const answer = (payload.output || []).flatMap(item => item.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('\n');
    res.json({ answer: answer || 'No text response returned.' });
  } catch (e) { res.status(502).json({ error: 'AI gateway failed to connect: ' + e.message }); }
});
app.listen(PORT, () => console.log(`CONVERGE Web listening on http://localhost:${PORT}`));
