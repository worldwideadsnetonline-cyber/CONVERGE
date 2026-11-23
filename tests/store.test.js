'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('../src/store');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'converge-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return path.join(dir, 'data.json');
}

test('cria espaço pessoal e mantém dados depois de reabrir', t => {
  const file = fixture(t);
  const first = createStore(file);
  const workspace = first.listWorkspaces()[0];
  assert.equal(workspace.name, 'Pessoal');
  const saved = first.saveMemory({ title: 'Objetivo', content: 'Construir o CONVERGE', workspaceId: workspace.id });
  const reopened = createStore(file);
  assert.equal(reopened.listMemories()[0].id, saved.id);
  assert.equal(reopened.listMemories()[0].content, 'Construir o CONVERGE');
});

test('edita e apaga memória sem afetar outros registos', t => {
  const store = createStore(fixture(t));
  const workspaceId = store.listWorkspaces()[0].id;
  const a = store.saveMemory({ title: 'A', content: 'Primeiro', workspaceId });
  store.saveMemory({ title: 'B', content: 'Segundo', workspaceId });
  const edited = store.saveMemory({ id: a.id, title: 'A atualizado', content: 'Alterado', workspaceId });
  assert.equal(edited.title, 'A atualizado');
  assert.equal(store.deleteMemory(a.id), true);
  assert.deepEqual(store.listMemories().map(m => m.title), ['B']);
  assert.equal(store.deleteMemory(a.id), false);
});

test('rejeita conteúdo vazio, demasiado longo e workspace desconhecido', t => {
  const store = createStore(fixture(t));
  const workspaceId = store.listWorkspaces()[0].id;
  assert.throws(() => store.saveMemory({ title: '', content: 'x', workspaceId }));
  assert.throws(() => store.saveMemory({ title: 'x', content: 'a'.repeat(12001), workspaceId }));
  assert.throws(() => store.saveMemory({ title: 'x', content: 'y', workspaceId: 'missing' }));
});

test('cria espaços de trabalho com validação', t => {
  const store = createStore(fixture(t));
  const project = store.createWorkspace({ name: 'Projeto Alpha', description: 'Teste' });
  assert.equal(store.listWorkspaces().length, 2);
  assert.equal(project.name, 'Projeto Alpha');
  assert.throws(() => store.createWorkspace({ name: ' ' }));
});

test('recupera apenas memórias relevantes do projeto selecionado', t => {
  const store = createStore(fixture(t));
  const personal = store.listWorkspaces()[0];
  const alpha = store.createWorkspace({ name: 'Projeto Alpha' });
  const relevant = store.saveMemory({ title: 'Arquitetura do CONVERGE', content: 'O motor de memória usa pesquisa contextual e recuperação por relevância.', workspaceId: alpha.id });
  store.saveMemory({ title: 'Receita de bolo', content: 'Farinha, ovos e açúcar.', workspaceId: alpha.id });
  store.saveMemory({ title: 'CONVERGE memória', content: 'Contexto de outro espaço não deve aparecer.', workspaceId: personal.id });
  const found = store.searchMemories(alpha.id, 'Como funciona a recuperação contextual da memória?');
  assert.equal(found.length, 1);
  assert.equal(found[0].id, relevant.id);
  assert.equal(store.searchMemories(personal.id, 'arquitetura converge').length, 1);
  assert.deepEqual(store.searchMemories(alpha.id, 'assunto sem correspondência'), []);
});
