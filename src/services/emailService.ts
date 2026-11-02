import { Task, Goal, Epic, EmailLog, EmailNotificationConfig } from '../types';

export function generateDailyDigestHtml(
  recipient: string,
  yesterdayTasks: Task[],
  todayTasks: Task[],
  activeWeeklyGoals: Goal[],
  epics: Epic[]
): { subject: string; summary: string; html: string } {
  const dateFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const todayEvents = todayTasks.filter((t) => !!t.time);
  const todayFlowTasks = todayTasks.filter((t) => !t.time);

  const getEpicName = (epicId?: string) => epics.find((e) => e.id === epicId)?.title || 'Geral';

  const subject = `[TaskFlow] Resumo Matinal - ${dateFormatted}`;
  const summary = `${yesterdayTasks.length} concluídas ontem • ${todayEvents.length} eventos e ${todayFlowTasks.length} tarefas de fluxo hoje`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 620px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #58a6ff; font-size: 20px; margin-bottom: 24px; }
    .header-title { font-size: 22px; color: #f0f6fc; margin: 0 0 6px 0; font-weight: 600; }
    .header-sub { font-size: 14px; color: #8b949e; margin-bottom: 28px; }
    .section-title { font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #58a6ff; font-weight: 700; border-bottom: 1px solid #21262d; padding-bottom: 8px; margin-top: 24px; margin-bottom: 14px; }
    .task-item { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; font-size: 14px; }
    .badge-event { background-color: #388bfd26; color: #58a6ff; border: 1px solid #388bfd4d; border-radius: 4px; padding: 2px 6px; font-size: 12px; font-weight: 600; font-family: monospace; }
    .badge-done { color: #3fb950; font-weight: bold; }
    .badge-priority { font-size: 11px; padding: 2px 5px; border-radius: 4px; text-transform: uppercase; font-weight: bold; }
    .p-urgente { background: #f8514926; color: #ff7b72; }
    .p-alta { background: #d2992226; color: #d29922; }
    .goal-box { background-color: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
    .progress-bar { background-color: #21262d; height: 6px; border-radius: 3px; overflow: hidden; margin-top: 8px; }
    .progress-fill { background-color: #238636; height: 100%; border-radius: 3px; }
    .footer { text-align: center; font-size: 12px; color: #6e7681; margin-top: 36px; border-top: 1px solid #21262d; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">⚡ TaskFlow • Bullet Journal & Agile Flow</div>
    <h1 class="header-title">Bom dia! Seu briefing diário está pronto.</h1>
    <div class="header-sub">${dateFormatted} • Destinatário: <strong>${recipient}</strong></div>

    <!-- Resultados de Ontem -->
    <div class="section-title">🏆 Vitórias de Ontem (${yesterdayTasks.length})</div>
    ${
      yesterdayTasks.length > 0
        ? yesterdayTasks
            .map(
              (t) => `
      <div class="task-item">
        <span class="badge-done">✓</span>
        <span style="color: #e6edf3;">${t.title}</span>
        <span style="color: #8b949e; font-size: 12px;">(${getEpicName(t.epicId)})</span>
      </div>`
            )
            .join('')
        : '<p style="color: #8b949e; font-size: 14px; font-style: italic;">Nenhuma tarefa marcada como concluída ontem.</p>'
    }

    <!-- Eventos do Dia -->
    <div class="section-title">⏰ Eventos com Horário Marcado (${todayEvents.length})</div>
    ${
      todayEvents.length > 0
        ? todayEvents
            .map(
              (t) => `
      <div class="task-item">
        <span class="badge-event">${t.time}</span>
        <strong style="color: #f0f6fc;">${t.title}</strong>
        <span style="color: #8b949e; font-size: 12px;">• ${getEpicName(t.epicId)}</span>
      </div>`
            )
            .join('')
        : '<p style="color: #8b949e; font-size: 14px; font-style: italic;">Nenhum evento com horário fixo hoje. Dia 100% aberto para fluxo contínuo!</p>'
    }

    <!-- Tarefas de Fluxo (Bullet Journal) -->
    <div class="section-title">🎯 Fluxo de Ações Prioritárias (${todayFlowTasks.length})</div>
    ${
      todayFlowTasks.length > 0
        ? todayFlowTasks
            .map(
              (t) => `
      <div class="task-item">
        <span style="color: #58a6ff;">●</span>
        <span style="color: #e6edf3;">${t.title}</span>
        <span class="badge-priority p-${t.priority}">${t.priority}</span>
        <span style="color: #8b949e; font-size: 12px;">[${t.status}]</span>
      </div>`
            )
            .join('')
        : '<p style="color: #8b949e; font-size: 14px; font-style: italic;">Nenhuma tarefa de fluxo planejada para hoje.</p>'
    }

    <!-- Metas Semanais em Andamento -->
    <div class="section-title">📈 Metas Semanais Ativas (${activeWeeklyGoals.length})</div>
    ${
      activeWeeklyGoals
        .map((g) => {
          const prog = g.progress ?? 50;
          return `
      <div class="goal-box">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #f0f6fc;">
          <span>${g.title}</span>
          <span>${prog}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${prog}%;"></div>
        </div>
      </div>`;
        })
        .join('')
    }

    <div class="footer">
      Gerado automaticamente pelo TaskFlow com base nas diretrizes ágeis e de Bullet Journal.<br>
      Para gerenciar tarefas ou via terminal, acesse o TaskFlow.
    </div>
  </div>
</body>
</html>
`;

  return { subject, summary, html };
}

export function generateEventReminderHtml(
  recipient: string,
  task: Task,
  epicName: string
): { subject: string; summary: string; html: string } {
  const subject = `[TaskFlow] Lembrete: "${task.title}" começa em 30 minutos!`;
  const summary = `Evento marcado para às ${task.time} hoje • Área: ${epicName}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family: sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 24px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 28px;">
    <h2 style="color: #58a6ff; margin-top: 0;">⏰ Lembrete de Evento (30 minutos)</h2>
    <p style="font-size: 18px; color: #f0f6fc; font-weight: 600;">${task.title}</p>
    <p style="color: #8b949e; font-size: 14px;"><strong>Horário:</strong> ${task.time} hoje</p>
    <p style="color: #8b949e; font-size: 14px;"><strong>Área / Épico:</strong> ${epicName}</p>
    ${task.description ? `<div style="background: #0d1117; border-left: 3px solid #58a6ff; padding: 10px 14px; margin: 16px 0; font-size: 13px; color: #e6edf3;">${task.description}</div>` : ''}
    <div style="font-size: 12px; color: #6e7681; border-top: 1px solid #30363d; padding-top: 14px; margin-top: 20px;">
      TaskFlow Smart Reminder • Enviado para ${recipient}
    </div>
  </div>
</body>
</html>
`;

  return { subject, summary, html };
}
