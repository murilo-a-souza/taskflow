import { Router } from 'express';
import { db } from '../services/db';
import { emailService } from '../services/emailService';
import { TaskStatus, Priority, Recurrence } from '../../src/types';

export const tasksRouter = Router();

// GET /api/tasks
tasksRouter.get('/', (req, res) => {
  try {
    let tasks = db.getTasks();
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
tasksRouter.get('/:id', (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
  }
  res.json({ success: true, data: task });
});

// POST /api/tasks
tasksRouter.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, date, time, recurrence, tags, epicId, goalId, blockedReason } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Título é obrigatório' });
    }

    const newTask = await db.createTask({
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

    // If created directly as blocked, send alert
    if (newTask.status === 'bloqueado' && newTask.blockedReason) {
      emailService.sendBlockedAlert(newTask).catch(() => {});
    }

    res.status(201).json({ success: true, data: newTask });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tasks/:id
tasksRouter.put('/:id', async (req, res) => {
  try {
    const updated = await db.updateTask(req.params.id, req.body);
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
tasksRouter.patch('/:id/status', async (req, res) => {
  try {
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

    const updated = await db.updateTask(req.params.id, updates);
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
tasksRouter.post('/batch', async (req, res) => {
  try {
    const { action, ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Array de IDs é obrigatório' });
    }

    if (action === 'delete') {
      const deleted = await db.batchDeleteTasks(ids);
      return res.json({ success: true, deletedCount: ids.length, successStatus: deleted });
    }

    if (action === 'update' && updates) {
      const updatedTasks = await db.batchUpdateTasks(ids, updates);
      return res.json({ success: true, count: updatedTasks.length, data: updatedTasks });
    }

    res.status(400).json({ success: false, error: 'Ação batch inválida. Use action="update" ou action="delete"' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada' });
    }
    res.json({ success: true, message: 'Tarefa excluída com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

