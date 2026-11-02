import { Router } from 'express';
import { db } from '../services/db';

export const tagsRouter = Router();

// GET /api/tags
tagsRouter.get('/', (req, res) => {
  try {
    const tags = db.getTags();
    res.json({ success: true, count: tags.length, data: tags });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tags
tagsRouter.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nome da tag é obrigatório' });
    }

    const newTag = await db.createTag(name.trim(), color || '#3b82f6');
    res.status(201).json({ success: true, data: newTag });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tags/:id
tagsRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteTag(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tag não encontrada' });
    }
    res.json({ success: true, message: 'Tag excluída com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

