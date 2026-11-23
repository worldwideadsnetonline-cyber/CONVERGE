# Roteiro de Engenharia — CONVERGE

O roteiro é orientado por capacidades verificáveis. As fases podem sobrepor-se apenas quando as dependências estiverem satisfeitas.

## Fase 0 — Fundamentos e auditoria
- [x] Recuperar e formalizar a visão Human × AI.
- [x] Auditar o repositório e identificar limites do protótipo.
- [x] Definir arquitetura de referência e princípios de segurança.
- [ ] Criar inventário completo de dependências, riscos e testes existentes.
- [ ] Definir decisões arquiteturais (ADRs) para persistência, IPC e fornecedores.

**Saída:** documentação base e critérios de aceitação.

## Fase 1 — Núcleo fiável
- [x] Introduzir módulo inicial de armazenamento local versionado sem quebrar a aplicação.
- [ ] Validar e tipar contratos IPC.
- [x] Adicionar testes unitários para espaços de trabalho e memória; restantes testes continuam pendentes.
- [ ] Implementar persistência versionada com migrações e exportação.
- [ ] Melhorar CSP, navegação externa, limites e cancelamento de pedidos.
- [ ] Criar pipeline de CI com testes, análise estática e build Windows.

**Aceitação:** dados sobrevivem a reinícios e migrações; segredos não aparecem no renderer/logs; testes e instalador passam no CI.

## Fase 2 — Espaços de trabalho e memória
- [ ] Projetos com nome, objetivo, estado e conteúdo relacionado.
- [ ] Memória explícita: guardar, listar, pesquisar, editar e apagar.
- [ ] Proveniência e âmbito de cada memória.
- [ ] Recuperação contextual limitada por projeto e relevância.
- [ ] Controlos para desativar memória e exportar/apagar dados.

**Aceitação:** o utilizador consegue inspecionar exatamente o que foi guardado e remover um item sem afetar outros.

## Fase 3 — Conhecimento e pesquisa fiável
- [ ] Abstração SearchProvider.
- [ ] Adaptador de pesquisa com timeout, retry, normalização e deduplicação.
- [ ] Fontes clicáveis com título, URL e data quando disponível.
- [ ] Testes para XML/HTML malformado, indisponibilidade e resultados vazios.
- [ ] Separar factos de fontes de inferências do modelo.

**Aceitação:** cada afirmação atribuída à pesquisa tem fonte rastreável; falhas não são ocultadas.

## Fase 4 — Ferramentas e execução
- [ ] Catálogo allowlist de ferramentas.
- [ ] Planos com passos, estado, progresso e cancelamento.
- [ ] Aprovação explícita para ações externas ou irreversíveis.
- [ ] Histórico local de execuções e resultados.
- [ ] Análise de ficheiros e criação de entregáveis.

**Aceitação:** nenhuma ferramenta fora da allowlist executa; ações de risco ficam bloqueadas até aprovação.

## Fase 5 — Experiência integrada
- [ ] Interface de projetos, memória, tarefas e conversa.
- [ ] Continuidade entre sessões e projetos.
- [ ] Configuração de fornecedor/modelo e limites de custos.
- [ ] Acessibilidade, desempenho e recuperação de erros.
- [ ] Testes de usabilidade e atualização segura.

**Aceitação:** um utilizador retoma um projeto, consulta memória e conclui uma tarefa sem reconstruir o contexto.

## Regras de entrega

- Cada fase termina com testes e revisão de segurança.
- Não marcar uma capacidade como concluída apenas porque o código compila.
- Não publicar instalador sem artefacto verificado.
- Não remover funcionalidades existentes sem substituição testada.
- Não solicitar que o utilizador execute comandos técnicos como etapa normal de validação.
