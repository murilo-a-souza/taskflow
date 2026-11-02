import { Router, Response } from 'express';
import { db } from '../services/db';
import { authService } from '../services/authService';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res: Response) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'O nome é obrigatório' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Forneça um endereço de e-mail válido' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'A senha deve conter pelo menos 6 caracteres' });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Já existe uma conta cadastrada com este e-mail' });
    }

    const { salt, hash } = authService.hashPassword(password);
    const user = await db.createUser(name.trim(), email.trim(), hash, salt);
    const token = authService.generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao registrar usuário' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }

    const isMatch = authService.verifyPassword(password, user.salt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }

    const token = authService.generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao efetuar login' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.findUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao verificar sessão' });
  }
});

