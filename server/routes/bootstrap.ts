import { Router } from 'express';
import { db } from '../services/db';

export const bootstrapRouter = Router();

bootstrapRouter.get('/', (req, res) => {
  try {
    const data = db.getData();
    res.json({
      success: true,
      data: {
        tasks: data.tasks,
        goals: data.goals,
        epics: data.epics,
        tags: data.tags,
        emailConfig: data.emailConfig,
        emailLogs: data.emailLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao carregar dados' });
  }
});

