'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const MAX_TITLE = 120;
const MAX_CONTENT = 12000;
function cleanText(value, field, max) {
  if (typeof value !== 'string') throw new Error(field + ' inválido.');
  const text = value.trim();
  if (!text || text.length > max) throw new Error(field + ' deve ter entre 1 e ' + max + ' caracteres.');
  return text;
}
function createStore(filePath) {
  const directory = path.dirname(filePath);
  let data;
  function initial() {
    const now = new Date().toISOString();
    const id = randomUUID();
    return { schemaVersion: 1, workspaces: [{ id, name: 'Pessoal', description: 'Espaço de trabalho principal', createdAt: now, updatedAt: now }], memories: [] };
  }
  function persist() {
    fs.mkdirSync(directory, { recursive: true });
    const temp = filePath + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temp, filePath);
  }
  function load() {
    if (data) return;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.workspaces) || !Array.isArray(parsed.memories)) throw new Error('Formato de dados desconhecido.');
      data = parsed;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Não foi possível abrir os dados do CONVERGE: ' + error.message);
      data = initial();
      persist();
    }
  }
  function snapshot(value) { return JSON.parse(JSON.stringify(value)); }
  function listWorkspaces() { load(); return snapshot(data.workspaces); }
  function createWorkspace(input) {
    load();
    const name = cleanText(input?.name, 'Nome do espaço', MAX_TITLE);
    const description = typeof input.description === 'string' ? input.description.trim().slice(0, 500) : '';
    const now = new Date().toISOString();
    const item = { id: randomUUID(), name, description, createdAt: now, updatedAt: now };
    data.workspaces.push(item); persist(); return snapshot(item);
  }
  function listMemories(workspaceId) {
    load();
    return snapshot(data.memories.filter(m => !workspaceId || m.workspaceId === workspaceId).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)));
  }
  function saveMemory(input) {
    load();
    const title = cleanText(input?.title, 'Título', MAX_TITLE);
    const content = cleanText(input?.content, 'Conteúdo', MAX_CONTENT);
    const workspaceId = input?.workspaceId || data.workspaces[0]?.id;
    if (!data.workspaces.some(w => w.id === workspaceId)) throw new Error('Espaço de trabalho não encontrado.');
    const existing = input?.id ? data.memories.find(m => m.id === input.id) : null;
    const now = new Date().toISOString();
    const item = existing
      ? { ...existing, title, content, updatedAt: now }
      : { id: randomUUID(), workspaceId, title, content, createdAt: now, updatedAt: now };
    if (existing) data.memories = data.memories.map(m => m.id === existing.id ? item : m);
    else data.memories.push(item);
    persist(); return snapshot(item);
  }
  function deleteMemory(id) {
    load();
    if (typeof id !== 'string' || id.length > 80) throw new Error('Identificador inválido.');
    const before = data.memories.length;
    data.memories = data.memories.filter(m => m.id !== id);
    if (before !== data.memories.length) persist();
    return before !== data.memories.length;
  }
  function searchMemories(workspaceId, query, limit = 5) {
    load();
    if (typeof workspaceId !== 'string' || !data.workspaces.some(w => w.id === workspaceId)) return [];
    const terms = [...new Set(tokenize(query))];
    if (!terms.length) return [];
    const cap = Number.isInteger(limit) ? Math.max(1, Math.min(limit, 10)) : 5;
    return snapshot(data.memories.filter(m => m.workspaceId === workspaceId).map(m => {
      const title = tokenize(m.title), body = tokenize(m.content);
      const score = terms.reduce((sum, term) => sum + (title.includes(term) ? 4 : 0) + (body.includes(term) ? 1 : 0), 0);
      return { ...m, relevance: score };
    }).filter(m => m.relevance > 0).sort((a,b) => b.relevance-a.relevance || b.updatedAt.localeCompare(a.updatedAt)).slice(0, cap));
  }
  function tokenize(s) {
    const ignored = new Set('a o os as um uma uns umas de do da dos das e em no na nos nas para por com sem que se ao aos eu tu ele ela nos voces voce meu minha meus minhas teu sua suas isto isso aqui ali como mais menos muito muita pouco pode podem deve devem sobre entre ate ja nao sim'.split(' '));
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(t => !ignored.has(t)) || [];
  }
  function exportData() { load(); return snapshot(data); }
  return { listWorkspaces, createWorkspace, listMemories, searchMemories, saveMemory, deleteMemory, exportData };
}
module.exports = { createStore };
