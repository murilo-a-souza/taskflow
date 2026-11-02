import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  emailFrom: process.env.EMAIL_FROM || 'TaskFlow <notifications@taskflow.dev>',
  resendApiKey: process.env.RESEND_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  dataDir: path.resolve(process.cwd(), 'server/data'),
  dbFilePath: path.resolve(process.cwd(), 'server/data/taskflow-db.json'),
};

