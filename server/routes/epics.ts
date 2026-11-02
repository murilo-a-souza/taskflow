import { Router } from 'express';
import { db } from '../services/db';

export const epicsRouter = Router();

// GET /api/epics
epicsRouter.get('/', (req, res) => {
  try {
    const epics = db.getEpics();
    res.json({ success: true, count: epics.length, data: epics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/epics
epicsRouter.post('/', async (req, res) => {
  try {
    const { title, description, vision, color, iconName } = req.body;
    if (!title || !description || !vision) {
      return res.status(400).json({ success: false, error: 'Título, descrição e visão de sucesso são obrigatórios' });
    }

    const newEpic = await db.createEpic({
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
epicsRouter.put('/:id', async (req, res) => {
  try {
    const updated = await db.updateEpic(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Épico não encontrado' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/epics/:id
epicsRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteEpic(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Épico não encontrado' });
    }
    res.json({ success: true, message: 'Épico excluído com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

