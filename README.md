# CONVERGE — Human × AI

**Um ambiente de colaboração contínua entre o ser humano e a inteligência artificial.**

O CONVERGE une comunicação natural, memória sob controlo do utilizador, conhecimento, raciocínio e capacidade de execução numa única experiência digital. Não é um clone de WhatsApp nem apenas uma interface para um chatbot.

> **Human × AI** — pensar em conjunto, construir conhecimento e transformar ideias em resultados.

## Estado do produto

A aplicação Electron atual é um **protótipo técnico inicial**. Demonstra uma interface de conversa, integração com a API OpenAI, armazenamento local do histórico e pesquisa web experimental. Não representa ainda a visão completa do CONVERGE.

Consulte:
- [Visão do produto](docs/PRODUCT_VISION.md)
- [Arquitetura de referência](docs/ARCHITECTURE.md)
- [Roteiro de engenharia](docs/ROADMAP.md)
- [Auditoria do protótipo](docs/PROTOTYPE_AUDIT.md)

## Princípios

1. **Continuidade contextual:** projetos, objetivos, decisões e conversas relacionados permanecem ligados.
2. **Memória controlada pelo utilizador:** visualizar, corrigir, exportar e apagar aquilo que o CONVERGE guarda.
3. **Inteligência contextual:** respostas consideram o contexto autorizado e relevante, não apenas a última mensagem.
4. **Execução com responsabilidade:** pesquisar, analisar, criar e executar tarefas com permissões explícitas e confirmação antes de ações externas sensíveis.
5. **Privacidade e segurança:** recolha mínima, armazenamento protegido e transparência sobre serviços externos.
6. **Independência tecnológica:** arquitetura preparada para diferentes fornecedores de modelos e, futuramente, modelos locais.

## Protótipo atual

- Aplicação desktop Electron para Windows.
- Conversas guardadas localmente no navegador da aplicação.
- Chave OpenAI protegida com Electron `safeStorage`.
- Integração com Chat Completions.
- Pesquisa web experimental através de Bing RSS.
- Compilação Windows NSIS via GitHub Actions.

## Compilação

Requer Node.js e dependências do projeto:

```bash
npm install
npm run dist:win
```

O workflow [Windows Build](.github/workflows/windows-build.yml) compila o instalador em `windows-latest` e publica o artefacto da execução.

## Custos de IA

O protótipo utiliza uma chave API OpenAI fornecida pelo utilizador. A utilização da API pode gerar custos na conta do fornecedor. A chave não deve ser partilhada em issues, commits ou conversas públicas.

## Princípio de evolução

A evolução deve preservar o que funciona, mas não ficar limitada à arquitetura do protótipo. Cada etapa deve incluir critérios de aceitação, testes automatizados e verificação do instalador Windows. Nenhuma funcionalidade será declarada concluída sem evidência de execução.
