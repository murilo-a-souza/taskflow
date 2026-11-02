import { Router, Response } from 'express';
import { db } from '../services/db';
import { emailService } from '../services/emailService';
import { TaskStatus, Priority, Recurrence } from '../../src/types';
import { optionalAuth, AuthenticatedRequest } from '../middlewares/auth';

export const tasksRouter = Router();

// GET /api/tasks
tasksRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    let tasks = db.getTasks(userId);
    const { status, priority, epicId, goalId, date, type } = req.query;

    if (status) tasks = tasks.filter((t) => t.status === status);
    if (priority) tasks = tasks.filter((t) => t.priority === priority);
    if (epicId) tasks = tasks.filter((t) => t.epicId === epicId);
    if (goalId) tasks = tasks.filter((t) => t.goalId === goalId);
    if (date) tasks = tasks.filter((t) => t.date === date);
    if (type === 'events') tasks = tasks.filter((t) => !!t.time);
    if (type === 'flow') tasks = tasks.filter((t) => !t.time);

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tasks/:id
tasksRouter.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const task = db.getTaskById(req.params.id, userId);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
  }
  res.json({ success: true, data: task });
});

// POST /api/tasks
tasksRouter.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const { title, description, status, priority, date, time, recurrence, tags, epicId, goalId, blockedReason } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Título é obrigatório' });
    }

    const newTask = await db.createTask(userId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      status: (status as TaskStatus) || 'planejando',
      priority: (priority as Priority) || 'media',
      date: date || undefined,
      time: time || undefined,
      recurrence: (recurrence as Recurrence) || 'none',
      tags: Array.isArray(tags) ? tags : [],
      epicId: epicId || undefined,
      goalId: goalId || undefined,
      blockedReason: status === 'bloqueado' ? blockedReason : undefined,
    });

    if (newTask.status === 'bloqueado' && newTask.blockedReason) {
      emailService.sendBlockedAlert(newTask).catch(() => {});
    }

    res.status(201).json({ success: true, data: newTask });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tasks/:id
tasksRouter.put('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const updated = await db.updateTask(userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }

    if (updated.status === 'bloqueado' && updated.blockedReason) {
      emailService.sendBlockedAlert(updated).catch(() => {});
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tasks/:id/status
tasksRouter.patch('/:id/status', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const { status, blockedReason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status é obrigatório' });
    }

    const updates: any = { status };
    if (status === 'bloqueado') {
      if (!blockedReason) {
        return res.status(400).json({ success: false, error: 'Motivo do bloqueio é obrigatório para status bloqueado' });
      }
      updates.blockedReason = blockedReason;
    } else {
      updates.blockedReason = undefined;
    }

    const updated = await db.updateTask(userId, req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }

    if (status === 'bloqueado') {
      emailService.sendBlockedAlert(updated).catch(() => {});
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks/batch
tasksRouter.post('/batch', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const { action, ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Array de IDs é obrigatório' });
    }

    if (action === 'delete') {
      const deleted = await db.batchDeleteTasks(userId, ids);
      return res.json({ success: true, deletedCount: ids.length, successStatus: deleted });
    }

    if (action === 'update' && updates) {
      const updatedTasks = await db.batchUpdateTasks(userId, ids, updates);
      return res.json({ success: true, count: updatedTasks.length, data: updatedTasks });
    }

    res.status(400).json({ success: false, error: 'Ação batch inválida. Use action="update" ou action="delete"' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const deleted = await db.deleteTask(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }
    res.json({ success: true, message: 'Tarefa excluída com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
