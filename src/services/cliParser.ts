import { Task, Goal, Epic, Tag, TaskStatus, Priority, Recurrence } from '../types';

export interface CliExecutionResult {
  output: string;
  isError?: boolean;
  isJson?: boolean;
  jsonData?: unknown;
  action?: {
    type: 'create_task' | 'update_task' | 'delete_task' | 'create_goal' | 'create_epic' | 'create_tag' | 'trigger_digest' | 'clear';
    payload?: any;
  };
}

export interface CliContext {
  tasks: Task[];
  goals: Goal[];
  epics: Epic[];
  tags: Tag[];
}

/**
 * Tokenize a command line string respecting quotes like --title="My task with spaces"
 */
export function tokenizeCommandLine(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if ((char === '"' || char === "'") && (!inQuotes || quoteChar === char)) {
      inQuotes = !inQuotes;
      quoteChar = inQuotes ? char : '';
      continue;
    }

    if (char === ' ' && !inQuotes) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parses arguments into key-value flags and positional parameters
 */
function parseFlags(tokens: string[]): { positional: string[]; flags: Record<string, string | boolean> } {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const parts = token.slice(2).split('=');
      const key = parts[0].toLowerCase();
      if (parts.length > 1) {
        flags[key] = parts.slice(1).join('=');
      } else if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
        flags[key] = tokens[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else if (token.startsWith('-') && token.length > 1) {
      const flagName = token.slice(1);
      if (flagName === 'j') flags['json'] = true;
      else if (flagName === 't') flags['today'] = true;
      else flags[flagName] = true;
    } else {
      positional.push(token);
    }
  }

  return { positional, flags };
}

export function executeCliCommand(rawCommand: string, context: CliContext): CliExecutionResult {
  const trimmed = rawCommand.trim();
  if (!trimmed) {
    return { output: '' };
  }

  const tokens = tokenizeCommandLine(trimmed);
  const root = tokens[0]?.toLowerCase();
  const sub = tokens[1]?.toLowerCase();
  const { positional, flags } = parseFlags(tokens.slice(1));
  const isJson = Boolean(flags['json'] || flags['j']);

  // Clear command
  if (root === 'clear' || root === 'cls') {
    return {
      output: '',
      action: { type: 'clear' },
    };
  }

  // Help command
  if (root === 'help' || flags['help'] || flags['h']) {
    return handleHelp(sub, isJson);
  }

  // TASK commands
  if (root === 'task') {
    return handleTaskCommand(sub, positional, flags, context, isJson);
  }

  // GOAL commands
  if (root === 'goal') {
    return handleGoalCommand(sub, positional, flags, context, isJson);
  }

  // EPIC commands
  if (root === 'epic') {
    return handleEpicCommand(sub, positional, flags, context, isJson);
  }

  // TAG commands
  if (root === 'tag') {
    return handleTagCommand(sub, positional, flags, context, isJson);
  }

  // EMAIL commands
  if (root === 'email') {
    if (sub === 'digest' || sub === 'test') {
      return {
        output: '⚡ Disparando geração e simulação de Resumo Matinal por e-mail...',
        action: { type: 'trigger_digest' },
      };
    }
    return {
      output: 'Comandos de e-mail disponíveis:\n  email digest     Gera e simula o envio do resumo diário matinal agora',
    };
  }

  return {
    output: `Comando desconhecido: "${root}". Digite 'help' para ver a lista de comandos suportados.`,
    isError: true,
  };
}

function handleHelp(sub?: string, isJson?: boolean): CliExecutionResult {
  const helpData = {
    app: 'TaskFlow CLI (v1.0.0)',
    description: 'Interface de terminal integrada para automação, devs e agentes de IA.',
    syntax: '<comando> <subcomando> [opções] [--json]',
    commands: [
      {
        command: 'task create',
        args: '--title="..." [--epic="..."] [--meta="..."] [--priority=baixa|media|alta|urgente] [--status=planejar|fazendo|revisando|concluido|bloqueado] [--date=YYYY-MM-DD] [--time=HH:MM] [--repeat=daily|weekly|etc] [--tags="t1,t2"]',
        example: 'task create --title="Revisar PR" --priority=alta --epic="Carreira & Engenharia" --time="14:00"',
        note: 'Se --time for definido, é tratado como EVENTO com notificação prévia de 30min.',
      },
      {
        command: 'task list',
        args: '[--status=...] [--epic=...] [--priority=...] [--today] [--events-only] [--flow-only] [--json]',
        example: 'task list --status=fazendo --json',
      },
      {
        command: 'task update <id>',
        args: '[--status=...] [--priority=...] [--title=...] [--time=...] [--reason=...]',
        example: 'task update TF-103 --status=concluido',
      },
      {
        command: 'task delete <id>',
        args: '<id>',
        example: 'task delete TF-108',
      },
      {
        command: 'task find <termo>',
        args: '"<termo>"',
        example: 'task find "arquitetura"',
      },
      {
        command: 'goal list',
        args: '[--type=annual|monthly|weekly] [--epic="..."] [--json]',
        example: 'goal list --type=weekly',
      },
      {
        command: 'goal create',
        args: '--title="..." --type=annual|monthly|weekly [--epic="..."] [--parent="..."] [--target=...]',
        example: 'goal create --title="Lançar TaskFlow V1" --type=monthly --epic="Carreira & Engenharia"',
      },
      {
        command: 'epic list',
        args: '[--json]',
        example: 'epic list --json',
      },
      {
        command: 'tag list',
        args: '[--json]',
        example: 'tag list',
      },
      {
        command: 'email digest',
        args: '',
        example: 'email digest',
      },
      {
        command: 'clear',
        args: '',
        example: 'clear',
      },
    ],
  };

  if (isJson) {
    return {
      output: JSON.stringify(helpData, null, 2),
      isJson: true,
      jsonData: helpData,
    };
  }

  const lines = [
    '═══════════════════════════════════════════════════════════════════',
    '⚡ TASKFLOW CLI • DOCUMENTAÇÃO DE COMANDOS',
    '═══════════════════════════════════════════════════════════════════',
    'Sintaxe geral: <comando> <subcomando> [opções] [--json]',
    '',
    '📌 COMANDOS DE TAREFAS:',
    '  task create --title="..." [opções]',
    '      Opções: --epic="nome/id", --meta="id", --priority=baixa|media|alta|urgente',
    '              --status=planejar|fazendo|revisando|concluido|bloqueado',
    '              --date=YYYY-MM-DD, --time=HH:MM (com hora vira EVENTO!)',
    '              --repeat=daily|weekdays|weekly|monthly, --tags="tag1,tag2"',
    '  task list [--status=...] [--epic=...] [--today] [--events-only] [--json]',
    '  task update <id> [--status=...] [--priority=...] [--title=...]',
    '  task delete <id>',
    '  task find "<termo_de_busca>"',
    '',
    '🎯 COMANDOS DE METAS & ÉPICOS:',
    '  goal list [--type=annual|monthly|weekly] [--json]',
    '  goal create --title="..." --type=annual|monthly|weekly [--epic="..."] [--parent="..."]',
    '  epic list [--json]',
    '  tag list [--json]',
    '',
    '📧 NOTIFICAÇÕES & SISTEMA:',
    '  email digest       Gera e simula envio do briefing diário matinal',
    '  clear              Limpa a tela do terminal',
    '',
    '💡 Dica: Adicione --json a qualquer comando para saída estruturada.',
    '═══════════════════════════════════════════════════════════════════',
  ];

  return {
    output: lines.join('\n'),
  };
}

function handleTaskCommand(
  sub: string | undefined,
  positional: string[],
  flags: Record<string, string | boolean>,
  context: CliContext,
  isJson: boolean
): CliExecutionResult {
  // task create
  if (sub === 'create' || sub === 'add') {
    const title = (flags['title'] as string) || positional[1];
    if (!title) {
      return {
        output: 'Erro: O parâmetro --title é obrigatório para criar uma tarefa. Ex: task create --title="Minha tarefa"',
        isError: true,
      };
    }

    // Resolve Epic
    let epicId: string | undefined = undefined;
    if (flags['epic']) {
      const epicQuery = String(flags['epic']).toLowerCase();
      const match = context.epics.find(
        (e) => e.id.toLowerCase() === epicQuery || e.title.toLowerCase().includes(epicQuery)
      );
      epicId = match?.id;
    }

    // Resolve Goal
    let goalId: string | undefined = undefined;
    if (flags['meta'] || flags['goal']) {
      const goalQuery = String(flags['meta'] || flags['goal']).toLowerCase();
      const match = context.goals.find(
        (g) => g.id.toLowerCase() === goalQuery || g.title.toLowerCase().includes(goalQuery)
      );
      goalId = match?.id;
    }

    // Resolve Tags
    const tagsResolved: string[] = [];
    if (flags['tags']) {
      const tagTokens = String(flags['tags']).split(',').map((t) => t.trim().toLowerCase());
      for (const tok of tagTokens) {
        const found = context.tags.find((t) => t.name.toLowerCase() === tok || t.id.toLowerCase() === tok);
        if (found) tagsResolved.push(found.id);
      }
    }

    const rawStatus = String(flags['status'] || 'planejando').toLowerCase();
    const statusMap: Record<string, TaskStatus> = {
      planejar: 'planejando',
      planejando: 'planejando',
      fazendo: 'fazendo',
      revisando: 'revisando',
      concluido: 'concluido',
      concluído: 'concluido',
      bloqueado: 'bloqueado',
    };
    const status: TaskStatus = statusMap[rawStatus] || 'planejando';

    const rawPriority = String(flags['priority'] || 'media').toLowerCase();
    const priorityMap: Record<string, Priority> = {
      baixa: 'baixa',
      media: 'media',
      média: 'media',
      alta: 'alta',
      urgente: 'urgente',
    };
    const priority: Priority = priorityMap[rawPriority] || 'media';

    const rawRecurrence = String(flags['repeat'] || 'none').toLowerCase();
    const recMap: Record<string, Recurrence> = {
      none: 'none',
      nenhuma: 'none',
      daily: 'daily',
      diaria: 'daily',
      diária: 'daily',
      weekdays: 'weekdays',
      weekly: 'weekly',
      semanal: 'weekly',
      monthly: 'monthly',
      mensal: 'monthly',
    };
    const recurrence: Recurrence = recMap[rawRecurrence] || 'none';

    const date = flags['date'] ? String(flags['date']) : new Date().toISOString().split('T')[0];
    const time = flags['time'] ? String(flags['time']) : undefined;

    // Generate new ID (e.g. TF-110)
    const nextNum = context.tasks.length + 101;
    const newTask: Task = {
      id: `TF-${nextNum}`,
      title,
      description: flags['desc'] ? String(flags['desc']) : undefined,
      status,
      priority,
      date,
      time,
      recurrence,
      tags: tagsResolved,
      epicId,
      goalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isJson) {
      return {
        output: JSON.stringify(newTask, null, 2),
        isJson: true,
        jsonData: newTask,
        action: { type: 'create_task', payload: newTask },
      };
    }

    const typeLabel = time ? `⏰ EVENTO às ${time}` : '🎯 FLUXO DE TRABALHO';
    return {
      output: `✓ Tarefa ${newTask.id} criada com sucesso!\n  Título: "${newTask.title}" [${typeLabel}]\n  Status: ${newTask.status} | Prioridade: ${newTask.priority} | Data: ${newTask.date}`,
      action: { type: 'create_task', payload: newTask },
    };
  }

  // task list
  if (sub === 'list' || sub === 'ls') {
    let filtered = [...context.tasks];

    if (flags['status']) {
      const q = String(flags['status']).toLowerCase();
      filtered = filtered.filter((t) => t.status.toLowerCase().includes(q));
    }

    if (flags['priority']) {
      const p = String(flags['priority']).toLowerCase();
      filtered = filtered.filter((t) => t.priority.toLowerCase() === p);
    }

    if (flags['epic']) {
      const eq = String(flags['epic']).toLowerCase();
      const epic = context.epics.find((e) => e.id.toLowerCase() === eq || e.title.toLowerCase().includes(eq));
      if (epic) {
        filtered = filtered.filter((t) => t.epicId === epic.id);
      }
    }

    if (flags['today'] || flags['t']) {
      const todayStr = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((t) => t.date === todayStr);
    }

    if (flags['events-only']) {
      filtered = filtered.filter((t) => Boolean(t.time));
    }

    if (flags['flow-only']) {
      filtered = filtered.filter((t) => !t.time);
    }

    if (isJson) {
      return {
        output: JSON.stringify(filtered, null, 2),
        isJson: true,
        jsonData: filtered,
      };
    }

    if (filtered.length === 0) {
      return { output: 'Nenhuma tarefa encontrada para os filtros fornecidos.' };
    }

    const lines = [
      `Total de tarefas listadas: ${filtered.length}`,
      '─'.repeat(70),
      'ID      STATUS       PRIOR   TIPO    DATA/HORA    TÍTULO',
      '─'.repeat(70),
    ];

    for (const t of filtered) {
      const typeStr = t.time ? `EVT ${t.time}` : 'FLUXO    ';
      const dateStr = t.date ? t.date.slice(5) : 'sem data';
      const line = `${t.id.padEnd(7)} ${t.status.padEnd(12)} ${t.priority.padEnd(7)} ${typeStr.padEnd(9)} ${dateStr.padEnd(10)} ${t.title}`;
      lines.push(line);
    }

    return { output: lines.join('\n') };
  }

  // task update <id>
  if (sub === 'update' || sub === 'edit') {
    const id = positional[1]?.toUpperCase();
    if (!id) {
      return { output: 'Erro: Especifique o ID da tarefa para atualizar. Ex: task update TF-101 --status=fazendo', isError: true };
    }

    const existing = context.tasks.find((t) => t.id === id);
    if (!existing) {
      return { output: `Erro: Tarefa ${id} não encontrada.`, isError: true };
    }

    const updates: Partial<Task> = {
      updatedAt: new Date().toISOString(),
    };

    if (flags['title']) updates.title = String(flags['title']);
    if (flags['status']) {
      const raw = String(flags['status']).toLowerCase();
      if (['planejando', 'fazendo', 'revisando', 'concluido', 'bloqueado'].includes(raw)) {
        updates.status = raw as TaskStatus;
        if (raw === 'concluido') {
          updates.completedAt = new Date().toISOString();
        }
      }
    }
    if (flags['priority']) {
      const raw = String(flags['priority']).toLowerCase();
      if (['baixa', 'media', 'alta', 'urgente'].includes(raw)) {
        updates.priority = raw as Priority;
      }
    }
    if (flags['reason']) updates.blockedReason = String(flags['reason']);
    if (flags['date']) updates.date = String(flags['date']);
    if (flags['time']) updates.time = String(flags['time']);

    const updatedTask = { ...existing, ...updates };

    if (isJson) {
      return {
        output: JSON.stringify(updatedTask, null, 2),
        isJson: true,
        jsonData: updatedTask,
        action: { type: 'update_task', payload: updatedTask },
      };
    }

    return {
      output: `✓ Tarefa ${id} atualizada com sucesso!`,
      action: { type: 'update_task', payload: updatedTask },
    };
  }

  // task delete <id>
  if (sub === 'delete' || sub === 'rm') {
    const id = positional[1]?.toUpperCase();
    if (!id) {
      return { output: 'Erro: Especifique o ID da tarefa a ser excluída. Ex: task delete TF-108', isError: true };
    }

    const exists = context.tasks.some((t) => t.id === id);
    if (!exists) {
      return { output: `Erro: Tarefa ${id} não encontrada.`, isError: true };
    }

    return {
      output: `✓ Tarefa ${id} excluída permanentemente.`,
      action: { type: 'delete_task', payload: { id } },
    };
  }

  // task find <query>
  if (sub === 'find' || sub === 'search') {
    const query = (positional[1] || String(flags['q'] || '')).toLowerCase();
    if (!query) {
      return { output: 'Erro: Especifique o termo de busca. Ex: task find "banco"', isError: true };
    }

    const matches = context.tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        t.id.toLowerCase().includes(query)
    );

    if (isJson) {
      return {
        output: JSON.stringify(matches, null, 2),
        isJson: true,
        jsonData: matches,
      };
    }

    if (matches.length === 0) {
      return { output: `Nenhum resultado encontrado para a busca: "${query}".` };
    }

    const lines = [`Resultados para "${query}" (${matches.length} tarefas encontradas):`];
    for (const t of matches) {
      lines.push(`• [${t.id}] ${t.title} (${t.status} | prioridade: ${t.priority})`);
    }

    return { output: lines.join('\n') };
  }

  return {
    output: `Subcomando de task inválido: "${sub}". Tente: create, list, update, delete, find.`,
    isError: true,
  };
}

function handleGoalCommand(
  sub: string | undefined,
  positional: string[],
  flags: Record<string, string | boolean>,
  context: CliContext,
  isJson: boolean
): CliExecutionResult {
  if (sub === 'list' || sub === 'ls') {
    let filtered = [...context.goals];
    if (flags['type']) {
      filtered = filtered.filter((g) => g.type === flags['type']);
    }

    if (isJson) {
      return {
        output: JSON.stringify(filtered, null, 2),
        isJson: true,
        jsonData: filtered,
      };
    }

    const lines = [
      `Total de metas: ${filtered.length}`,
      'ID              TIPO       PROGRESSO  TÍTULO',
      '─'.repeat(70),
    ];

    for (const g of filtered) {
      const prog = `${g.progress ?? 0}%`;
      lines.push(`${g.id.padEnd(15)} ${g.type.padEnd(10)} ${prog.padEnd(10)} ${g.title}`);
    }

    return { output: lines.join('\n') };
  }

  if (sub === 'create' || sub === 'add') {
    const title = (flags['title'] as string) || positional[1];
    const type = (flags['type'] as any) || 'weekly';

    if (!title) {
      return { output: 'Erro: Parâmetro --title obrigatório para criar meta.', isError: true };
    }

    const newGoal: Goal = {
      id: `goal-${Date.now().toString().slice(-4)}`,
      title,
      type,
      period: flags['period'] ? String(flags['period']) : '2026',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (isJson) {
      return {
        output: JSON.stringify(newGoal, null, 2),
        isJson: true,
        jsonData: newGoal,
        action: { type: 'create_goal', payload: newGoal },
      };
    }

    return {
      output: `✓ Meta criada com sucesso: [${newGoal.id}] ${newGoal.title} (${newGoal.type})`,
      action: { type: 'create_goal', payload: newGoal },
    };
  }

  return {
    output: `Subcomando de goal inválido: "${sub}". Suportados: list, create.`,
    isError: true,
  };
}

function handleEpicCommand(
  sub: string | undefined,
  _positional: string[],
  flags: Record<string, string | boolean>,
  context: CliContext,
  isJson: boolean
): CliExecutionResult {
  if (sub === 'list' || sub === 'ls') {
    if (isJson) {
      return {
        output: JSON.stringify(context.epics, null, 2),
        isJson: true,
        jsonData: context.epics,
      };
    }

    const lines = ['ÉPICOS / SPECS (ÁREAS FUNDAMENTAIS DE VIDA):', '─'.repeat(70)];
    for (const e of context.epics) {
      const tasksCount = context.tasks.filter((t) => t.epicId === e.id).length;
      lines.push(`• [${e.id}] ${e.title} (${tasksCount} tarefas)`);
      lines.push(`  Visão: ${e.vision}`);
    }
    return { output: lines.join('\n') };
  }

  return { output: `Subcomando de epic inválido: "${sub}". Suportados: list.`, isError: true };
}

function handleTagCommand(
  sub: string | undefined,
  _positional: string[],
  _flags: Record<string, string | boolean>,
  context: CliContext,
  isJson: boolean
): CliExecutionResult {
  if (sub === 'list' || sub === 'ls') {
    if (isJson) {
      return {
        output: JSON.stringify(context.tags, null, 2),
        isJson: true,
        jsonData: context.tags,
      };
    }

    const lines = ['MARCADORES / TAGS DISPONÍVEIS:'];
    for (const tag of context.tags) {
      lines.push(`• #${tag.name} (id: ${tag.id}, cor: ${tag.color})`);
    }
    return { output: lines.join('\n') };
  }

  return { output: `Subcomando de tag inválido: "${sub}". Suportados: list.`, isError: true };
}
