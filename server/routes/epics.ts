import { Router, Response } from 'express';
import { db } from '../services/db';
import { optionalAuth, AuthenticatedRequest } from '../middlewares/auth';

export const epicsRouter = Router();

// GET /api/epics
epicsRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const epics = db.getEpics(userId);
    res.json({ success: true, count: epics.length, data: epics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/epics
epicsRouter.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const { title, description, vision, color, iconName } = req.body;
    if (!title || !description || !vision) {
      return res.status(400).json({ success: false, error: 'Título, descrição e visão de sucesso são obrigatórios' });
    }

    const newEpic = await db.createEpic(userId, {
      title: title.trim(),
      description: description.trim(),
      vision: vision.trim(),
      color: color || '#3b82f6',
      iconName: iconName || 'Target',
    });

    res.status(201).json({ success: true, data: newEpic });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/epics/:id
epicsRouter.put('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const updated = await db.updateEpic(userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Épico não encontrado' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/epics/:id
epicsRouter.delete('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const deleted = await db.deleteEpic(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Épico não encontrado' });
    }
    res.json({ success: true, message: 'Épico excluído com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
