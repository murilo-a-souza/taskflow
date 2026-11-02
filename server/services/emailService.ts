import { config } from '../config';
import { db } from './db';
import { Task, EmailLog } from '../../src/types';
import { generateDailyDigestHtml, generateEventReminderHtml } from '../../src/services/emailService';

export class EmailService {
  /**
   * Internal sender method using Resend API (native fetch) or simulation fallback
   */
  private async dispatch(
    type: 'daily_digest' | 'event_reminder' | 'blocked_alert',
    recipient: string,
    subject: string,
    summary: string,
    html: string,
    userId?: string
  ): Promise<EmailLog> {
    const logId = `email-${Date.now().toString(36)}`;
    let status: 'simulado' | 'enviado' = 'simulado';

    if (config.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.resendApiKey}`,
          },
          body: JSON.stringify({
            from: config.emailFrom,
            to: [recipient],
            subject,
            html,
          }),
        });

        if (response.ok) {
          status = 'enviado';
          console.log(`[Email] E-mail enviado via Resend para ${recipient} [${subject}]`);
        } else {
          const errData = await response.text();
          console.warn(`[Email] Falha ao enviar via Resend: ${errData}. Usando modo simulado.`);
        }
      } catch (err) {
        console.warn('[Email] Erro de rede ao conectar com Resend:', err);
      }
    } else {
      console.log(`[Email-Simulado] ${type.toUpperCase()} -> ${recipient} | "${subject}"`);
    }

    const emailLog: EmailLog = {
      id: logId,
      userId,
      type,
      recipient,
      subject,
      summary,
      contentHtml: html,
      sentAt: new Date().toISOString(),
      status,
    };

    await db.addEmailLog(emailLog);
    return emailLog;
  }

  /**
   * Dispara o briefing matinal consolidado
   */
  public async sendDailyDigest(overrideRecipient?: string, userId?: string): Promise<EmailLog> {
    const emailConfig = db.getEmailConfig(userId);
    const recipient = overrideRecipient || emailConfig.targetEmail || 'usuario@taskflow.dev';

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tasks = db.getTasks(userId);
    const goals = db.getGoals(userId);
    const epics = db.getEpics(userId);

    const yesterdayTasks = tasks.filter((t) => {
      if (t.status !== 'concluido') return false;
      if (t.completedAt && t.completedAt.startsWith(yesterdayStr)) return true;
      if (t.date === yesterdayStr) return true;
      return false;
    });

    const todayTasks = tasks.filter((t) => t.date === todayStr);
    const activeWeeklyGoals = goals.filter((g) => g.type === 'weekly' && g.status === 'active');

    const { subject, summary, html } = generateDailyDigestHtml(
      recipient,
      yesterdayTasks,
      todayTasks,
      activeWeeklyGoals,
      epics
    );

    const log = await this.dispatch('daily_digest', recipient, subject, summary, html, userId);

    // Update lastDigestSent in config
    await db.updateEmailConfig(userId, { lastDigestSent: todayStr });

    return log;
  }

  /**
   * Dispara lembrete de 30 minutos para um evento com hora marcada
   */
  public async sendEventReminder(task: Task, userId?: string): Promise<EmailLog | null> {
    const effectiveUserId = userId || task.userId;
    const emailConfig = db.getEmailConfig(effectiveUserId);
    const recipient = emailConfig.targetEmail || 'usuario@taskflow.dev';

    const epics = db.getEpics(effectiveUserId);
    const epic = epics.find((e) => e.id === task.epicId);
    const epicName = epic?.title || 'Geral';

    const { subject, summary, html } = generateEventReminderHtml(recipient, task, epicName);
    return this.dispatch('event_reminder', recipient, subject, summary, html, effectiveUserId);
  }

  /**
   * Dispara alerta de tarefa bloqueada
   */
  public async sendBlockedAlert(task: Task, userId?: string): Promise<EmailLog | null> {
    const effectiveUserId = userId || task.userId;
    const emailConfig = db.getEmailConfig(effectiveUserId);
    if (!emailConfig.sendOnBlocked) return null;

    const recipient = emailConfig.targetEmail || 'usuario@taskflow.dev';
    const epics = db.getEpics(effectiveUserId);
    const epic = epics.find((e) => e.id === task.epicId);
    const epicName = epic?.title || 'Geral';

    const subject = `[TaskFlow] Alerta: Tarefa Bloqueada "${task.title}"`;
    const summary = `Motivo: ${task.blockedReason || 'Não informado'} • Área: ${epicName}`;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family: sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 24px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #161b22; border: 1px solid #f851494d; border-radius: 12px; padding: 28px;">
    <h2 style="color: #ff7b72; margin-top: 0;">🚫 Tarefa Bloqueada</h2>
    <p style="font-size: 18px; color: #f0f6fc; font-weight: 600;">${task.title}</p>
    <p style="color: #8b949e; font-size: 14px;"><strong>Área / Épico:</strong> ${epicName}</p>
    <div style="background: #0d1117; border-left: 3px solid #ff7b72; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #ff7b72;">
      <strong>Motivo do Bloqueio:</strong><br>${task.blockedReason || 'Motivo não especificado.'}
    </div>
    <div style="font-size: 12px; color: #6e7681; border-top: 1px solid #30363d; padding-top: 14px; margin-top: 20px;">
      TaskFlow Alert Engine • Enviado para ${recipient}
    </div>
  </div>
</body>
</html>
`;

    return this.dispatch('blocked_alert', recipient, subject, summary, html, effectiveUserId);
  }
}

export const emailService = new EmailService();
