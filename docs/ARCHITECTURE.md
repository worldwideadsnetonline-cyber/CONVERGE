# Arquitetura de Referência — CONVERGE

Este documento define uma direção técnica, não afirma que os módulos já estejam implementados.

## Requisitos arquiteturais

- Desktop Windows como primeira plataforma, sem acoplar o domínio à Electron.
- Persistência local-first e migrações explícitas.
- Separação entre interface, domínio, casos de uso e adaptadores externos.
- Fornecedores de IA e pesquisa substituíveis.
- Ferramentas executadas no processo privilegiado, com validação de entrada e permissões.
- Testes unitários, integração e smoke tests do pacote Windows.

## Camadas propostas

```
Interface Desktop
  ├─ Conversa e composição
  ├─ Projetos e documentos
  ├─ Memória e pesquisa
  └─ Tarefas e aprovações
          │
Aplicação / Casos de Uso
  ├─ Enviar mensagem e montar contexto
  ├─ Recuperar/editar memória
  ├─ Criar e acompanhar tarefa
  └─ Aprovar/invocar ferramenta
          │
Domínio CONVERGE
  ├─ Workspace / Project
  ├─ Conversation / Message
  ├─ MemoryItem / Decision
  ├─ Task / ToolRun / Approval
  └─ Source / Attachment
          │
Portas (interfaces)
  ├─ ModelProvider
  ├─ SearchProvider
  ├─ MemoryRepository
  ├─ WorkspaceRepository
  ├─ FileExtractor
  └─ ToolExecutor
          │
Adaptadores
  ├─ OpenAI (primeiro adaptador)
  ├─ Pesquisa web (fornecedor configurável)
  ├─ Base de dados local
  ├─ Sistema de ficheiros
  └─ Integrações autorizadas
```

## Estrutura de código de destino

A estrutura final pode evoluir para:

- `src/main/`: processo desktop privilegiado, IPC, ciclo de vida e segurança.
- `src/preload/`: API pequena, tipada e validada entre renderer e main.
- `src/renderer/`: interface e estado visual.
- `src/application/`: casos de uso e orquestração.
- `src/domain/`: entidades, regras e contratos.
- `src/infrastructure/`: persistência, fornecedores de IA/pesquisa e ficheiros.
- `tests/`: testes unitários, integração e segurança.
- `docs/`: decisões e especificações.

A migração será incremental; não se deve reescrever tudo antes de existir cobertura de testes.

## Dados e memória

Modelo inicial de entidades:
- Workspace: espaço pessoal do utilizador.
- Project: objetivo ou área de trabalho.
- Conversation e Message: interação e respetivas mensagens.
- MemoryItem: conteúdo explicitamente guardado, origem, âmbito, data e estado.
- Task: objetivo executável, passos, estado e cancelamento.
- ToolRun: ferramenta invocada, argumentos permitidos, resultado e duração.
- Approval: ação que aguarda consentimento.
- Source: referência de origem, URL, título e data de consulta.
- Attachment: metadados e localização segura de ficheiros.

A base de dados deve suportar migrações, cópias de segurança e exportação. O conteúdo de memória deve ter âmbito (pessoal/projeto/conversa), proveniência e operações de editar/apagar. A pesquisa semântica pode ser adicionada depois de existir uma camada de armazenamento e recuperação fiável.

## Segurança

- Manter `contextIsolation: true`, `nodeIntegration: false` e sandbox ativo.
- Política CSP restritiva; sem permissões genéricas desnecessárias.
- Validar todos os argumentos IPC no processo principal.
- Não expor tokens, chaves ou APIs privilegiadas ao renderer.
- Guardar segredos com armazenamento do sistema operativo e permitir rotação/remoção.
- Restringir navegação, janelas novas, downloads e acesso a ficheiros.
- Tratar mensagens, resultados web e ficheiros como dados não confiáveis, nunca como instruções de sistema.
- Pedir confirmação antes de partilhar dados, publicar, enviar, apagar ou realizar ações de impacto.
- Registar auditoria local das ações, sem guardar segredos.

## Fornecedores de IA e pesquisa

A aplicação comunica com interfaces internas, não diretamente com um fornecedor em cada componente. OpenAI é o primeiro adaptador; outros fornecedores e modelos locais podem ser acrescentados sem alterar o domínio. A pesquisa web deve ser independente do modelo e devolver resultados normalizados com URL, título, excerto e timestamp quando disponível.

## Estratégia de execução

A primeira versão de execução de ferramentas deve ser allowlist, com esquemas por ferramenta, limites de tempo, cancelamento e confirmação por risco. Não implementar execução arbitrária de comandos nem acesso irrestrito ao sistema.

## Decisões ainda em aberto

- SQLite ou outro armazenamento local: decidir após protótipo de migração e requisitos de sincronização.
- Framework visual: manter HTML/CSS/JS enquanto suficiente ou migrar com justificação.
- Pesquisa vetorial: adiar até o volume e qualidade da memória justificarem.
- Sincronização entre dispositivos: fora do primeiro marco; requer modelo de identidade, cifragem e resolução de conflitos.
