import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { bootstrapRouter } from './routes/bootstrap';
import { tasksRouter } from './routes/tasks';
import { goalsRouter } from './routes/goals';
import { epicsRouter } from './routes/epics';
import { tagsRouter } from './routes/tags';
import { emailRouter } from './routes/email';
import { scheduler } from './services/scheduler';

const app = express();

// Middleware: CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware: JSON Body Parser
app.use(express.json());

// Middleware: Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'TaskFlow Backend Engine',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/bootstrap', bootstrapRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/epics', epicsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/email', emailRouter);

// Production Static Serving
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server (if not in test mode)
let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`
  ⚡ TaskFlow Backend Service
  -----------------------------------------------
  📡 API Server:    http://localhost:${config.port}/api
  🩺 Healthcheck:   http://localhost:${config.port}/api/health
  📁 Storage file:  ${config.dbFilePath}
  ⏰ Scheduler:     Ativo (resumo matinal & alertas 30min)
  -----------------------------------------------
    `);

    // Start background notifications scheduler
    scheduler.start();
  });

  // Graceful Shutdown
  const shutdown = () => {
    console.log('\n[Server] Encerrando TaskFlow backend graciosamente...');
    scheduler.stop();
    if (server) {
      server.close(() => {
        console.log('[Server] Servidor HTTP finalizado.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;
