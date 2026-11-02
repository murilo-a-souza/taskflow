import { Router } from 'express';
import { db } from '../services/db';
import { emailService } from '../services/emailService';

export const emailRouter = Router();

// GET /api/email/config
emailRouter.get('/config', (req, res) => {
  try {
    const config = db.getEmailConfig();
    res.json({ success: true, data: config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/email/config
emailRouter.put('/config', async (req, res) => {
  try {
    const updated = await db.updateEmailConfig(req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/email/logs
emailRouter.get('/logs', (req, res) => {
  try {
    const logs = db.getEmailLogs();
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/email/digest (Trigger daily digest manually now)
emailRouter.post('/digest', async (req, res) => {
  try {
    const { recipient } = req.body || {};
    const log = await emailService.sendDailyDigest(recipient);
    res.json({ success: true, message: 'Resumo matinal disparado com sucesso', data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Falha ao disparar resumo matinal' });
  }
});

// POST /api/email/reminder/:taskId (Trigger test reminder for a task)
emailRouter.post('/reminder/:taskId', async (req, res) => {
  try {
    const task = db.getTaskById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }
    const log = await emailService.sendEventReminder(task);
    res.json({ success: true, message: 'Lembrete de evento disparado com sucesso', data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

