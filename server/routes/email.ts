import { Router, Response } from 'express';
import { db } from '../services/db';
import { emailService } from '../services/emailService';
import { optionalAuth, AuthenticatedRequest } from '../middlewares/auth';

export const emailRouter = Router();

// GET /api/email/config
emailRouter.get('/config', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const config = db.getEmailConfig(userId);
    res.json({ success: true, data: config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/email/config
emailRouter.put('/config', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const updated = await db.updateEmailConfig(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/email/logs
emailRouter.get('/logs', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const logs = db.getEmailLogs(userId);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/email/digest (Trigger daily digest manually now)
emailRouter.post('/digest', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { recipient } = req.body || {};
    const log = await emailService.sendDailyDigest(recipient, userId);
    res.json({ success: true, message: 'Resumo matinal disparado com sucesso', data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Falha ao disparar resumo matinal' });
  }
});

// POST /api/email/reminder/:taskId (Trigger test reminder for a task)
emailRouter.post('/reminder/:taskId', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const task = db.getTaskById(req.params.taskId, userId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }
    const log = await emailService.sendEventReminder(task, userId);
    res.json({ success: true, message: 'Lembrete de evento disparado com sucesso', data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
