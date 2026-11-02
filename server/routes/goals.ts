import { Router, Response } from 'express';
import { db } from '../services/db';
import { GoalType } from '../../src/types';
import { optionalAuth, AuthenticatedRequest } from '../middlewares/auth';

export const goalsRouter = Router();

// GET /api/goals
goalsRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    let goals = db.getGoals(userId);
    const { type, epicId, parentId } = req.query;

    if (type) goals = goals.filter((g) => g.type === type);
    if (epicId) goals = goals.filter((g) => g.epicId === epicId);
    if (parentId) goals = goals.filter((g) => g.parentId === parentId);

    res.json({ success: true, count: goals.length, data: goals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/goals
goalsRouter.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const { title, description, type, parentId, epicId, period, targetValue, currentValue, unit, status } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Título é obrigatório' });
    }
    if (!type || !['annual', 'monthly', 'weekly'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Tipo de meta inválido (annual, monthly, weekly)' });
    }

    const newGoal = await db.createGoal(userId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      type: type as GoalType,
      parentId: parentId || undefined,
      epicId: epicId || undefined,
      period: period || new Date().getFullYear().toString(),
      targetValue: targetValue ? Number(targetValue) : undefined,
      currentValue: currentValue ? Number(currentValue) : undefined,
      unit: unit || undefined,
      status: status || 'active',
    });

    res.status(201).json({ success: true, data: newGoal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/goals/:id
goalsRouter.put('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const updated = await db.updateGoal(userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Meta não encontrada' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/goals/:id
goalsRouter.delete('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const deleted = await db.deleteGoal(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Meta não encontrada' });
    }
    res.json({ success: true, message: 'Meta excluída com sucesso e tarefas desvinculadas com segurança' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
