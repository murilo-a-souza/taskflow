import { Router, Response } from 'express';
import { db } from '../services/db';
import { optionalAuth, AuthenticatedRequest } from '../middlewares/auth';

export const tagsRouter = Router();

// GET /api/tags
tagsRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tags = db.getTags(userId);
    res.json({ success: true, count: tags.length, data: tags });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tags
tagsRouter.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const { name, color } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nome da tag é obrigatório' });
    }

    const newTag = await db.createTag(userId, name.trim(), color || '#3b82f6');
    res.status(201).json({ success: true, data: newTag });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tags/:id
tagsRouter.delete('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 'default_user';
    const deleted = await db.deleteTag(userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tag não encontrada' });
    }
    res.json({ success: true, message: 'Tag excluída com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
