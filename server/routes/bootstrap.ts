import { Router, Response } from 'express';
import { db } from '../services/db';
import { optionalAuth, AuthenticatedRequest } from '../middlewares/auth';

export const bootstrapRouter = Router();

bootstrapRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tasks = db.getTasks(userId);
    const goals = db.getGoals(userId);
    const epics = db.getEpics(userId);
    const tags = db.getTags(userId);
    const emailConfig = db.getEmailConfig(userId);
    const emailLogs = db.getEmailLogs(userId);

    res.json({
      success: true,
      data: {
        tasks,
        goals,
        epics,
        tags,
        emailConfig,
        emailLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao carregar dados' });
  }
});
