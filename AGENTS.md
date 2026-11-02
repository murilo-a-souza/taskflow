# TaskFlow • Guia para Agentes de IA & Engenharia de Software

Este documento define o contrato de produto, arquitetura, restrições e diretrizes de automação para agentes autônomos de IA e desenvolvedores que interagem ou estendem o **TaskFlow**.

---

## 1. Descrição Geral do Projeto

O **TaskFlow** é um sistema escalável de gerenciamento de tarefas e metas que combina a disciplina e rastreabilidade de metodologias ágeis (GitHub Projects, Jira) com a flexibilidade psicológica e foco no fluxo de trabalho diário do **Bullet Journal (BuJo)**.

### Filosofia Central:
1. **Separação Conceitual (Eventos vs. Tarefas de Fluxo Contínuo)**:
   * **Eventos (`time` preenchido)**: Compromissos com horário exato (reuniões, cultos, consultas). Disparam notificações prévias (30 minutos antes) e aparecem em slots fixos na agenda.
   * **Tarefas de Fluxo (`time` ausente)**: Itens orientados ao dia e à semana, sem a ansiedade de horários rígidos. Priorizam a cadência diária de execução sem cobranças artificiais de atraso.
2. **Cascata Estratégica (Cascading Goals)**:
   * **Metas Semanais** (sprints de execução) alimentam **Metas Mensais**, que por sua vez consolidam as **Metas Anuais** de longo prazo.
3. **Áreas Fundamentais de Vida (Épicos / Specs)**:
   * Classificação em dimensões estruturantes da vida humana: *Carreira & Engenharia*, *Finanças & Liberdade*, *Saúde & Performance*, *Igreja & Espiritualidade*, *Estudos & Pesquisa*.
4. **CLI-First para Humanos e Agentes**:
   * Terminal integrado acessível por atalho de teclado (`Ctrl + ~`) ou interface visual, com suporte nativo a flags POSIX e formato `--json` para automações e agentes de IA.

---

## 2. Goal (Objetivo do Sistema)

Proporcionar uma interface de alta produtividade e uma API/CLI estruturada que permita a um usuário (ou a um agente de IA operando em seu nome) planejar a vida estratégica em metas anuais/mensais, desdobrá-las em sprints semanais, conduzir o fluxo diário em quadros Kanban/Lista/Calendário, e receber briefings matinais inteligentes por e-mail com as conquistas de ontem e as prioridades de hoje.

---

## 3. Context (Contexto e Arquitetura)

* **Camada Front-End**: React 19 + TypeScript + Tailwind CSS v4 + Lucide React + Motion.
* **Componentização**: Estrutura modular em `src/components/` dividida por domínios:
  * `kanban/`: Quadro ágil de 5 colunas com drag-and-drop e filtros.
  * `list/`: Visão em lista com notações do Bullet Journal (`✓`, `●`, `!`, `⏰`) e ações em lote.
  * `calendar/`: Alternância semanal/mensal com segregação entre eventos e fluxo.
  * `goals/`: Árvore de hierarquia cascata (Anual $\rightarrow$ Mês $\rightarrow$ Semana).
  * `epics/`: Gestão das áreas mestras de vida e objetivos atrelados.
  * `terminal/`: Drawer embutido estilo VS Code com parser dedicado.
  * `notifications/`: Central de preferências de e-mail e preview do briefing HTML.
* **Camada Back-End**: Node.js + Express + TypeScript (`server/index.ts`) com rotas RESTful para autenticação, tarefas, metas, épicos, tags e e-mails.
* **Autenticação & Multi-Tenant**: Gestão de sessões via JWT nativo com hash seguro de senhas (`crypto.scryptSync` + salt) e isolamento estrito de dados por `userId`.
* **Motor de Notificações**: Serviço com suporte ao Resend e agendador contínuo em background (`server/services/scheduler.ts`) para resumo matinal às 08:00 e alertas 30min antes de eventos.
* **Integração de IA**: Compatibilidade com **Google AI Studio** e Gemini API (`@google/genai`) para planejamento estratégico autônomo.
* **Estado Global e Persistência**:
  * `src/context/TaskFlowContext.tsx` e `src/context/AuthContext.tsx`: Store central com sincronização direta via `src/services/api.ts` e cache resiliente em `localStorage`.
  * Banco de dados persistente atômico em `server/data/taskflow-db.json` com auto-seeding.
* **Tokens de Estilo Únicos**:
  * Centralizados em `src/index.css` (`.tf-card`, `.tf-input`, `.tf-btn-primary`, `.tf-btn-secondary`, `.tf-badge`, `.tf-font-mono`).

---

## 4. Constraints (Restrições)

1. **Anti-Fricção BuJo**: Tarefas sem horário **não devem** ser tratadas como compromissos de agenda; nenhuma tarefa de fluxo deve ser rotulada como "atrasada" apenas pela passagem de uma hora específica.
2. **Integridade da Cascata**: A exclusão de uma meta pai (anual ou mensal) nunca deve quebrar ou corromper tarefas filhas; as tarefas devem ser suavemente desvinculadas mantendo integridade referencial.
3. **Agente/CLI Contrato Puro**: Qualquer comando executado com a flag `--json` no terminal **deve obrigatoriamente** retornar JSON sintaticamente válido, sem prefixos de log decorativos na saída do JSON, permitindo parsing direto por LLMs via `JSON.parse()`.
4. **Sem Secrets no Cliente**: Configurações de e-mail na V1 devem operar via simulação estruturada no front-end e desacopladas para rotas de backend `/api/*` em produção.
5. **Estilização**: Manter o arquivo de estilo único (`src/index.css`) e usar Tailwind CSS utilitário para classes de visualização.

---

## 5. Requisitos Funcionais (RFs)

* **RF01 - Metas em Cascata (Anual $\rightarrow$ Mensal $\rightarrow$ Semanal)**:
  * Criar, editar, listar e excluir metas nos 3 níveis.
  * O progresso da meta semanal é calculado com base nas tarefas concluídas atreladas a ela.
  * O progresso da meta mensal é a média das metas semanais filhas.
  * O progresso da meta anual é a média das metas mensais filhas.
* **RF02 - Épicos / Specs de Áreas de Vida**:
  * Gestão de áreas mestras (ex: Igreja, Finanças, Saúde, Estudos, Carreira).
  * Cada épico contém descrição, visão de sucesso, metas e tarefas associadas.
* **RF03 - Tarefas e Atributos**:
  * Título, descrição (suporte a Markdown), status (`planejando`, `fazendo`, `revisando`, `concluido`, `bloqueado`).
  * Prioridade (`baixa`, `media`, `alta`, `urgente`), marcadores/tags, repetição (`none`, `daily`, `weekdays`, `weekly`, `monthly`).
  * Data e horário opcionais.
  * Vínculo bidirecional com Metas e com Épicos.
  * Motivo de bloqueio obrigatório quando o status for `bloqueado`.
* **RF04 - Separação Conceitual de Eventos vs. Fluxo**:
  * Tarefas com `time` definido = **Eventos** (notificação 30min antes, exibição em destaque no calendário).
  * Tarefas sem `time` = **Ações de Fluxo** (foco no dia/semana sem horário fixo).
* **RF05 - Visualização Kanban**:
  * 5 colunas baseadas no status com drag-and-drop HTML5, transição rápida de status e filtros combinados.
* **RF06 - Visualização em Lista (Bullet Journal)**:
  * Agrupamento por Status, Épico ou Prioridade.
  * Seleção múltipla e barra flutuante de ações em lote (concluir, mover status, excluir).
* **RF07 - Visualização em Calendário / Roadmap**:
  * Alternância Semanal e Mensal destacando eventos em blocos de tempo e listando tarefas de fluxo.
* **RF08 - Terminal CLI Integrado**:
  * Acessível no rodapé, expansível e documentado via comando `help`.
  * Comandos de consulta e mutação para tasks, goals, epics e tags com suporte a `--json`.
* **RF09 - Notificações por E-mail (Briefing Diário & Alertas)**:
  * Resumo matinal consolidando: (1) Vitórias/concluídas de ontem, (2) Eventos de hoje com horário, (3) Fluxo prioritário de hoje, (4) Status das metas semanais ativas.
  * Alerta com antecedência de 30 minutos para eventos com hora marcada.
  * Visualizador e gerador de templates HTML renderizados no modal.
* **RF10 - Autenticação JWT e Multi-Tenant**:
  * Cadastro e login de usuários com hash criptográfico `scrypt` e token JWT (7 dias).
  * Isolamento completo de dados por `userId` com auto-seeding no primeiro login.
  * Modo demonstração rápida ("Continuar como Visitante").
* **RF11 - Deploy em Nuvem e Containerização**:
  * Build multi-stage via `Dockerfile` servindo API Express e estáticos Vite no mesmo processo.
  * Blueprint `render.yaml` pronto para deploy contínuo no Render.com com scheduler ativo.

---

## 6. Contrato de Comandos do Terminal CLI (Para Agentes de IA)

O terminal pode ser alimentado diretamente com strings de comando. Abaixo estão os comandos essenciais e exemplos de payloads:

### 6.1. Criar Tarefa
```bash
# Tarefa de fluxo contínuo vinculada a Épico e Meta
task create --title="Implementar autenticação JWT" --epic="Carreira & Engenharia" --priority=alta --status=planejando --tags="dev,backend"

# Evento com horário marcado (gera alerta de 30 minutos)
task create --title="Alinhamento de Arquitetura" --date=2026-11-02 --time=14:30 --priority=urgente --epic="Carreira & Engenharia"
```

### 6.2. Listar Tarefas (Humano e JSON)
```bash
# Listagem formatada para leitura humana
task list --status=fazendo --today

# Saída em JSON puro (ideal para agentes consumirem)
task list --status=fazendo --json
task list --epic="Finanças & Liberdade" --json
```

### 6.3. Atualizar Tarefa
```bash
task update TF-103 --status=concluido
task update TF-108 --status=bloqueado --reason="Aguardando liberação de token de API"
```

### 6.4. Buscar Tarefas
```bash
task find "reunião"
task find "arquitetura" --json
```

### 6.5. Deletar Tarefa
```bash
task delete TF-108
```

### 6.6. Metas e Épicos
```bash
# Listar metas
goal list --type=weekly --json
goal list --type=annual

# Criar meta semanal vinculada
goal create --title="Rodar 25km na semana" --type=weekly --epic="Saúde & Performance" --parent="goal-mes-3"

# Listar épicos
epic list --json
```

### 6.7. E-mail e Sistema
```bash
# Disparar simulação do resumo matinal diário imediatamente
email digest

# Limpar tela do console
clear
```

---

## 7. Done-When (Critérios de Aceite para V1)

O sistema é considerado aceito e pronto para homologação quando:

1. **CRUD Integral**:
   * É possível criar, listar, editar e excluir Metas, Épicos, Tags e Tarefas tanto pela UI gráfica (modais) quanto pelo Terminal CLI.
2. **Propagação Reativa em Cascata**:
   * Ao marcar uma tarefa associada a uma meta semanal como `concluido`, o percentual da meta semanal avança;
   * O novo percentual da meta semanal atualiza instantaneamente a média da meta mensal correspondente;
   * A meta anual reflete o progresso das metas mensais filhas.
3. **Comportamento Diferenciado de Eventos vs. Fluxo**:
   * Tarefas com `time` possuem distintivo de relógio âmbar, aparecem na seção "Eventos" do calendário e no briefing de e-mail como compromissos agendados;
   * Tarefas sem `time` aparecem na seção "Fluxo Contínuo", sem exigência de horário.
4. **Operação do Terminal CLI**:
   * O comando `help` exibe a lista completa de comandos;
   * Comandos com `--json` retornam objetos ou arrays JSON válidos;
   * Pressionar as teclas $\uparrow$ / $\downarrow$ navega pelo histórico de comandos digitados;
   * Atalho `Ctrl + ~` colapsa e expande o terminal em qualquer tela da aplicação.
5. **Briefing Matinal por E-mail**:
   * O acionamento do botão "Disparar Resumo Agora" ou do comando `email digest` gera um novo registro no histórico;
   * A aba "Visualização do E-mail HTML" renderiza com fidelidade o e-mail contendo os dados de ontem e de hoje.
6. **Compilação e Tipagem**:
   * O projeto compila com sucesso via `npm run build` / `compile_applet`;
   * Nenhuma falha no linter (`npm run lint` / `tsc --noEmit`).

---

## 8. Como Testar o TaskFlow

### Teste 1: Fluxo de Criação e Drag-and-Drop no Kanban
1. Acesse a aba **Kanban**.
2. Clique no botão `+` na coluna **Planejando** ou no botão superior **Nova Tarefa**.
3. Preencha o título: `"Refatorar camada de dados"`, selecione prioridade `Alta`, épico `Carreira & Engenharia`.
4. Clique em **Criar Tarefa**.
5. Na coluna Planejando, arraste o cartão para a coluna **Fazendo**. Observe a atualização imediata do contador da coluna.
6. Clique na setinha de avanço rápido no rodapé do cartão para movê-lo para **Revisando** e depois **Concluído**.

### Teste 2: Validação da Cascata de Metas
1. Acesse a aba **Metas Cascata**.
2. Observe a meta anual `"Construir e lançar 2 produtos escaláveis"` e a meta semanal filha `"Implementar UI modular e terminal integrado do TaskFlow"`.
3. Volte para o Kanban e conclua as tarefas que possuem vínculo com essa meta semanal.
4. Retorne para a aba **Metas Cascata** e verifique que a barra de progresso da meta semanal, da meta mensal e da meta anual subiram proporcionalmente.

### Teste 3: Automação via Terminal CLI
1. Clique no botão **CLI** no topo direito ou pressione `Ctrl + ~`.
2. Digite `help` e pressione Enter. Verifique o manual formatado.
3. Digite:
   ```bash
   task create --title="Criar suíte de testes E2E" --priority=alta --status=planejando
   ```
4. Verifique a mensagem de sucesso com o ID gerado (ex: `TF-110`).
5. Digite:
   ```bash
   task list --json
   ```
6. Clique no botão de cópia ao lado da saída para confirmar a extração do JSON.
7. Digite:
   ```bash
   task find "suíte"
   ```
8. Verifique que a tarefa recém-criada é localizada instantaneamente.

### Teste 4: Ações em Lote na Lista (Bullet Journal)
1. Acesse a aba **Lista & BuJo**.
2. Marque a checkbox de 2 ou mais tarefas.
3. Observe o surgimento da barra flutuante de ações em lote no topo.
4. Clique em **Concluir** na barra flutuante. Todas as tarefas selecionadas recebem o símbolo `✓` e o status `concluido`.

### Teste 5: Simulação do Resumo Matinal por E-mail
1. Clique no ícone de envelope (**Central de Notificações por E-mail**) no cabeçalho.
2. Clique no botão **"Disparar Resumo Agora"**.
3. O sistema gerará o relatório diário matinal em tempo real.
4. Visualize o template HTML renderizado na aba de preview, conferindo as vitórias de ontem, eventos com hora marcada de hoje e metas em andamento.

---

## 9. Status de Entrega & Próximos Passos (V2 & V3)

### Entregas Realizadas na V2:
1. **[Concluído] Camada Back-End Completa**: Servidor Express em TypeScript com rotas REST (`/api/tasks`, `/api/goals`, `/api/epics`, `/api/tags`, `/api/bootstrap`, `/api/email`).
2. **[Concluído] Autenticação JWT e Multi-Tenant**: Registro, login, verificação de sessão e isolamento total de dados por usuário.
3. **[Concluído] Persistência Atômica**: Armazenamento em `server/data/taskflow-db.json` com auto-seeding e sincronização reativa com front-end.
4. **[Concluído] Motor de E-mails & Scheduler**: Agendador contínuo em background (`scheduler.ts`) para resumo matinal às 08:00 e alertas 30min antes de eventos.
5. **[Concluído] Prontidão para Deploy**: `Dockerfile` multi-stage e `render.yaml` para hospedagem com 1 clique.

### Próximos Passos (Evolução V3):
1. **Agente de IA Autônomo com Gemini API (`@google/genai`)**:
   * Conectar a chave `GEMINI_API_KEY` do Google AI Studio a um comando CLI `ai plan --prompt="..."` capaz de decompor anotações livres em épicos, metas e tarefas estruturadas automaticamente.
2. **Banco em Nuvem (Postgres / Firestore)**:
   * Chave de ambiente `DATABASE_URL` para conectar a um banco gerenciado (Supabase/Neon/Firestore) quando em escala empresarial.
