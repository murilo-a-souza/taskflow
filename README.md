# ⚡ TaskFlow • Agile & Bullet Journal Flow

> Sistema escalável de produtividade e gerenciamento de tarefas que integra a rastreabilidade de metodologias ágeis (GitHub Projects, Jira) com a disciplina psicológica e foco diário do **Bullet Journal (BuJo)**, com terminal CLI nativo para humanos e agentes de IA.

---

## 📑 Índice

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Funcionalidades Principais](#-funcionalidades-principais)
3. [Ferramentas e Tecnologias](#-ferramentas-e-tecnologias)
4. [Integração com Google AI Studio & Gemini API](#-integração-com-google-ai-studio--gemini-api)
5. [Contrato do Terminal CLI](#-contrato-do-terminal-cli-para-agentes-e-humanos)
6. [Instalação e Execução Local](#-instalação-e-execução-local)
7. [Deploy em Produção](#-deploy-em-produção)
8. [Estrutura de Diretórios](#-estrutura-de-diretórios)
9. [Diretrizes para Agentes de IA](#-diretrizes-para-agentes-de-ia)

---

## 🎯 Sobre o Projeto

O **TaskFlow** resolve a ansiedade e a sobrecarga de ferramentas tradicionais ao aplicar dois conceitos fundamentais:
* **Separação Conceitual (Eventos vs. Fluxo Contínuo)**: Compromissos com horário marcado (`time` preenchido) geram alertas prévios de 30 minutos e ocupam slots fixos de agenda. Tarefas sem horário fixo pertencem ao fluxo diário/semanal sem cobrança artificial de atraso.
* **Metas em Cascata (Cascading Goals)**: Sprints semanais de execução alimentam metas mensais, que por sua vez consolidam os objetivos anuais de longo prazo.

---

## ✨ Funcionalidades Principais

| Domínio | Descrição |
| :--- | :--- |
| **🎯 Metas em Cascata** | Hierarquia Anual $\rightarrow$ Mensal $\rightarrow$ Semanal com recálculo reativo do progresso baseado na conclusão de tarefas filhas. |
| **📋 Quadro Kanban** | 5 colunas ágeis (*Planejando, Fazendo, Revisando, Concluído, Bloqueado*) com drag-and-drop HTML5, avanço rápido e motivo obrigatório para bloqueios. |
| **📓 Lista & BuJo** | Visão inspirada no Bullet Journal com símbolos (`✓` concluído, `●` fluxo, `⏰` evento), agrupamentos e barra flutuante de ações em lote. |
| **📅 Calendário & Roadmap** | Alternância semanal/mensal com blocos de tempo para compromissos agendados e lista lateral de fluxo. |
| **⚡ Terminal CLI (`Ctrl + ~`)** | Console embutido estilo VS Code com suporte a flags POSIX e formato `--json` para integração direta com LLMs. |
| **📧 Briefings por E-mail** | Relatório diário matinal às 08:00 (vitórias de ontem + compromissos de hoje) e lembretes 30 minutos antes para eventos agendados. |
| **🔐 Autenticação & Multi-Tenant** | Cadastro, login com token JWT (7 dias), senhas criptografadas com `scrypt` e isolamento estrito de dados por usuário. |

---

## 🛠️ Ferramentas e Tecnologias

### Front-End
* **React 19** + **TypeScript**
* **Tailwind CSS v4** + Design tokens customizados (`.tf-card`, `.tf-input`, `.tf-btn-primary`)
* **Lucide React** (iconografia moderna)
* **Motion** (transições e animações fluidas)
* **Vite** (build tooling e servidor de desenvolvimento com proxy reverso)

### Back-End & Persistência
* **Node.js** + **Express**
* **TSX** (TypeScript Execution Engine com hot reload)
* **JWT Nativo + Crypto Engine** (hashing de senhas seguro via `crypto.scryptSync` e verificação contra timing attacks)
* **Storage Engine Atômico**: Persistência estruturada em JSON (`taskflow-db.json`) com escritas transacionais e auto-seeding

### IA & Automação
* **Google AI Studio**: Plataforma de desenvolvimento e orquestração de IA
* **Gemini API (`@google/genai`)**: SDK oficial para planejamento autônomo e decomposição de metas estratégicas

### Infraestrutura & Deploy
* **Docker**: Build multi-stage otimizado em Alpine Linux
* **Render**: Blueprint declarativo (`render.yaml`) para deploy full-stack com scheduler contínuo

---

## 🤖 Integração com Google AI Studio & Gemini API

O projeto foi projetado com suporte de primeira classe ao ecossistema do **Google AI Studio**:

* **Declaração de Capacidade**: Homologado em `metadata.json` com `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
* **Injeção Segura de Chaves**: A variável `GEMINI_API_KEY` é injetada automaticamente em runtime via AI Studio Secrets, sem expor credenciais no cliente.
* **Agente de Planejamento**: Capacidade de processar prompts em linguagem natural via CLI (`ai plan --prompt="..."`) para sugerir desdobramentos de épicos, metas e tarefas.

---

## 💻 Contrato do Terminal CLI (Para Agentes e Humanos)

Acesse o console a qualquer momento via interface ou atalho **`Ctrl + ~`**:

```bash
# Criar tarefa de fluxo contínuo
task create --title="Implementar autenticação JWT" --epic="Carreira & Engenharia" --priority=alta

# Criar evento com horário marcado (dispara alerta de 30 minutos)
task create --title="Alinhamento de Arquitetura" --date=2026-11-02 --time=14:30 --priority=urgente

# Listagem estruturada em JSON para consumo de agentes/LLMs
task list --status=fazendo --json
goal list --type=weekly --json

# Atualizar status
task update TF-103 --status=concluido
task update TF-108 --status=bloqueado --reason="Aguardando liberação de API"

# Disparar resumo matinal por e-mail imediatamente
email digest
```

---

## 🚀 Instalação e Execução Local

### Pré-requisitos
* **Node.js**: v20+ ou v22+
* **npm**: v10+

### Passo a Passo

1. **Clonar e instalar dependências**:
   ```bash
   git clone https://github.com/seu-usuario/taskflow.git
   cd taskflow
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
   *(Preencha `RESEND_API_KEY` se desejar envio real de e-mails; caso contrário, o TaskFlow operará no modo de simulação estruturada).*

3. **Iniciar os servidores**:
   ```bash
   # Terminal 1 - Back-End Express (porta 3001)
   npm run dev:server

   # Terminal 2 - Front-End Vite (porta 3000)
   npm run dev
   ```

4. Acesse **`http://localhost:3000`** no navegador.

---

## 🌐 Deploy em Produção

### Opção 1: Render.com (1-Clique via Blueprint)
1. Conecte o repositório ao [Render.com](https://render.com).
2. O Render lerá o arquivo `render.yaml` e criará o Web Service automaticamente.
3. Comandos executados:
   * **Build**: `npm ci && npm run build`
   * **Start**: `npm run server`

### Opção 2: Container Docker
```bash
# Construir a imagem multi-stage
docker build -t taskflow:latest .

# Executar container na porta 3000
docker run -d -p 3000:3000 --name taskflow taskflow:latest
```

---

## 📂 Estrutura de Diretórios

```
taskflow/
├── server/                    # Camada de Back-End (Express + TypeScript)
│   ├── index.ts               # Servidor HTTP, middlewares, CORS e rotas estáticas
│   ├── config.ts              # Configurações e leitura de variáveis de ambiente
│   ├── middlewares/           # Middleware requireAuth e optionalAuth
│   ├── routes/                # Rotas REST (/api/auth, /api/tasks, /api/goals, etc.)
│   ├── services/              # db.ts (persistência), authService.ts, emailService.ts, scheduler.ts
│   └── data/                  # Base de dados atômica (taskflow-db.json)
├── src/                       # Camada de Front-End (React 19 + TypeScript)
│   ├── components/
│   │   ├── auth/              # AuthScreen (Login e Registro)
│   │   ├── kanban/            # Quadro Kanban com drag-and-drop
│   │   ├── list/              # Visão Bullet Journal e ações em lote
│   │   ├── calendar/          # Visão de calendário mensal/semanal
│   │   ├── goals/             # Árvore hierárquica de metas em cascata
│   │   ├── epics/             # Gerenciamento de áreas de vida
│   │   ├── terminal/          # Terminal CLI integrado (Ctrl + ~)
│   │   └── notifications/     # Central de e-mail e preview do briefing
│   ├── context/               # AuthContext e TaskFlowContext
│   ├── services/              # api.ts, cliParser.ts, emailService.ts, mockData.ts
│   └── types/                 # Definições de tipos TypeScript
├── Dockerfile                 # Multi-stage build para produção
├── render.yaml                # Especificação de deploy no Render
└── AGENTS.md                  # Manual e diretrizes de engenharia para agentes de IA
```

---

## 🤖 Diretrizes para Agentes de IA

Para agentes autônomos que operam ou estendem o TaskFlow:
* Consulte o [AGENTS.md](file:///home/murilo/projects/taskflow/AGENTS.md) para verificar regras de arquitetura, integridade da cascata e contratos estritos da API e CLI.
* Nunca quebre o contrato `--json` do terminal CLI.

