import { db } from './db';
import { emailService } from './emailService';

class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private notifiedEventsToday: Set<string> = new Set();
  private lastCheckedDay: string = '';

  public start(): void {
    if (this.timer) return;

    console.log('[Scheduler] Motor de notificações e agendamento de e-mails iniciado.');
    // Check every 60 seconds
    this.timer = setInterval(() => {
      this.checkAndDispatch().catch((err) => {
        console.error('[Scheduler] Erro durante verificação de notificações:', err);
      });
    }, 60 * 1000);

    // Initial check on startup
    this.checkAndDispatch().catch((err) => {
      console.error('[Scheduler] Erro no check inicial:', err);
    });
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] Motor de notificações pausado.');
    }
  }

  private async checkAndDispatch(): Promise<void> {
    const config = db.getEmailConfig();
    if (!config.enabled) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Reset notified events cache on day rollover
    if (this.lastCheckedDay !== todayStr) {
      this.notifiedEventsToday.clear();
      this.lastCheckedDay = todayStr;
    }

    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    // 1. Check Daily Digest
    // If today's digest hasn't been sent yet and current time reached or passed the configured digest time
    if (config.lastDigestSent !== todayStr && currentTimeStr >= config.dailyDigestTime) {
      console.log(`[Scheduler] Disparando Resumo Matinal Diário agendado para às ${config.dailyDigestTime}...`);
      await emailService.sendDailyDigest();
    }

    // 2. Check 30-minute Event Reminders
    const tasks = db.getTasks();
    const nowMinutesTotal = now.getHours() * 60 + now.getMinutes();

    for (const task of tasks) {
      if (task.date !== todayStr || !task.time || task.status === 'concluido') {
        continue;
      }

      if (this.notifiedEventsToday.has(task.id)) {
        continue;
      }

      const [taskHoursStr, taskMinsStr] = task.time.split(':');
      const taskHours = parseInt(taskHoursStr, 10);
      const taskMins = parseInt(taskMinsStr, 10);
      if (isNaN(taskHours) || isNaN(taskMins)) continue;

      const taskMinutesTotal = taskHours * 60 + taskMins;
      const minutesUntilEvent = taskMinutesTotal - nowMinutesTotal;

      // If event is within configured reminder window (e.g. 25-35 minutes or <= eventReminderMinutes and > 0)
      const reminderWindow = config.eventReminderMinutes || 30;
      if (minutesUntilEvent <= reminderWindow && minutesUntilEvent >= reminderWindow - 10) {
        console.log(`[Scheduler] Evento "${task.title}" em ${minutesUntilEvent} minutos. Enviando lembrete...`);
        await emailService.sendEventReminder(task);
        this.notifiedEventsToday.add(task.id);
      }
    }
  }
}

export const scheduler = new NotificationScheduler();

