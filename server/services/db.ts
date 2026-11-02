import fs from 'fs';
import path from 'path';
import { config } from '../config';
import {
  Task,
  Goal,
  Epic,
  Tag,
  EmailNotificationConfig,
  EmailLog,
} from '../../src/types';
import {
  initialTasks,
  initialGoals,
  initialEpics,
  initialTags,
  initialEmailConfig,
} from '../../src/services/mockData';

export interface DatabaseSchema {
  tasks: Task[];
  goals: Goal[];
  epics: Epic[];
  tags: Tag[];
  emailConfig: EmailNotificationConfig;
  emailLogs: EmailLog[];
}

class DatabaseService {
  private inMemoryData: DatabaseSchema | null = null;
  private isSaving = false;
  private pendingSave = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    try {
      if (!fs.existsSync(config.dataDir)) {
        fs.mkdirSync(config.dataDir, { recursive: true });
      }

      if (!fs.existsSync(config.dbFilePath)) {
        const initialData: DatabaseSchema = {
          tasks: initialTasks,
          goals: initialGoals,
          epics: initialEpics,
          tags: initialTags,
          emailConfig: initialEmailConfig,
          emailLogs: [],
        };
        fs.writeFileSync(config.dbFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
        this.inMemoryData = initialData;
      } else {
        const raw = fs.readFileSync(config.dbFilePath, 'utf-8');
        try {
          const parsed = JSON.parse(raw);
          this.inMemoryData = {
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : initialTasks,
            goals: Array.isArray(parsed.goals) ? parsed.goals : initialGoals,
            epics: Array.isArray(parsed.epics) ? parsed.epics : initialEpics,
            tags: Array.isArray(parsed.tags) ? parsed.tags : initialTags,
            emailConfig: parsed.emailConfig || initialEmailConfig,
            emailLogs: Array.isArray(parsed.emailLogs) ? parsed.emailLogs : [],
          };
        } catch {
          // Fallback if corrupt
          const fallbackData: DatabaseSchema = {
            tasks: initialTasks,
            goals: initialGoals,
            epics: initialEpics,
            tags: initialTags,
            emailConfig: initialEmailConfig,
            emailLogs: [],
          };
          fs.writeFileSync(config.dbFilePath, JSON.stringify(fallbackData, null, 2), 'utf-8');
          this.inMemoryData = fallbackData;
        }
      }
    } catch (err) {
      console.error('[DB] Erro ao inicializar banco de dados:', err);
      this.inMemoryData = {
        tasks: initialTasks,
        goals: initialGoals,
        epics: initialEpics,
        tags: initialTags,
        emailConfig: initialEmailConfig,
        emailLogs: [],
      };
    }
  }

  public getData(): DatabaseSchema {
    if (!this.inMemoryData) {
      this.ensureInitialized();
    }
    return this.inMemoryData!;
  }

  private async persist(): Promise<void> {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    this.isSaving = true;
    try {
      const dataStr = JSON.stringify(this.inMemoryData, null, 2);
      const tempPath = `${config.dbFilePath}.${Date.now()}.tmp`;
      await fs.promises.writeFile(tempPath, dataStr, 'utf-8');
      await fs.promises.rename(tempPath, config.dbFilePath);
    } catch (err) {
      console.error('[DB] Falha ao persistir no disco:', err);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        await this.persist();
      }
    }
  }

  // --- Task Methods ---
  public getTasks(): Task[] {
    return this.getData().tasks;
  }

  public getTaskById(id: string): Task | undefined {
    return this.getData().tasks.find((t) => t.id === id);
  }

  public async createTask(taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const data = this.getData();
    // Generate sequential ID based on TF-xxx
    let nextNum = 101;
    const existingNums = data.tasks
      .map((t) => {
        const match = t.id.match(/^TF-(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n) && n > 0);

    if (existingNums.length > 0) {
      nextNum = Math.max(...existingNums) + 1;
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskInput,
      id: `TF-${nextNum}`,
      createdAt: now,
      updatedAt: now,
    };

    data.tasks.push(newTask);
    await this.persist();
    return newTask;
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const data = this.getData();
    const index = data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = data.tasks[index];
    const now = new Date().toISOString();
    const updated: Task = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt,
      updatedAt: now,
      completedAt:
        updates.status === 'concluido' && existing.status !== 'concluido'
          ? now
          : updates.status && updates.status !== 'concluido'
          ? undefined
          : existing.completedAt,
    };

    data.tasks[index] = updated;
    await this.persist();
    return updated;
  }

  public async deleteTask(id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.tasks.length;
    data.tasks = data.tasks.filter((t) => t.id !== id);
    if (data.tasks.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  public async batchUpdateTasks(ids: string[], updates: Partial<Task>): Promise<Task[]> {
    const data = this.getData();
    const now = new Date().toISOString();
    const updatedTasks: Task[] = [];

    data.tasks = data.tasks.map((t) => {
      if (ids.includes(t.id)) {
        const updated: Task = {
          ...t,
          ...updates,
          id: t.id,
          createdAt: t.createdAt,
          updatedAt: now,
          completedAt:
            updates.status === 'concluido' && t.status !== 'concluido'
              ? now
              : updates.status && updates.status !== 'concluido'
              ? undefined
              : t.completedAt,
        };
        updatedTasks.push(updated);
        return updated;
      }
      return t;
    });

    await this.persist();
    return updatedTasks;
  }

  public async batchDeleteTasks(ids: string[]): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.tasks.length;
    data.tasks = data.tasks.filter((t) => !ids.includes(t.id));
    if (data.tasks.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Goal Methods ---
  public getGoals(): Goal[] {
    return this.getData().goals;
  }

  public async createGoal(goalInput: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const data = this.getData();
    const newGoal: Goal = {
      ...goalInput,
      id: `goal-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    data.goals.push(newGoal);
    await this.persist();
    return newGoal;
  }

  public async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    const data = this.getData();
    const index = data.goals.findIndex((g) => g.id === id);
    if (index === -1) return null;

    data.goals[index] = {
      ...data.goals[index],
      ...updates,
      id: data.goals[index].id,
    };
    await this.persist();
    return data.goals[index];
  }

  public async deleteGoal(id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.goals.length;
    data.goals = data.goals.filter((g) => g.id !== id);

    // Unlink child tasks gracefully (Constraint: Anti-corrupção da cascata)
    data.tasks = data.tasks.map((t) => (t.goalId === id ? { ...t, goalId: undefined } : t));

    if (data.goals.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Epic Methods ---
  public getEpics(): Epic[] {
    return this.getData().epics;
  }

  public async createEpic(epicInput: Omit<Epic, 'id' | 'createdAt'>): Promise<Epic> {
    const data = this.getData();
    const newEpic: Epic = {
      ...epicInput,
      id: `epic-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    data.epics.push(newEpic);
    await this.persist();
    return newEpic;
  }

  public async updateEpic(id: string, updates: Partial<Epic>): Promise<Epic | null> {
    const data = this.getData();
    const index = data.epics.findIndex((e) => e.id === id);
    if (index === -1) return null;

    data.epics[index] = {
      ...data.epics[index],
      ...updates,
      id: data.epics[index].id,
    };
    await this.persist();
    return data.epics[index];
  }

  public async deleteEpic(id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.epics.length;
    data.epics = data.epics.filter((e) => e.id !== id);

    // Unlink tasks & goals linked to this epic
    data.tasks = data.tasks.map((t) => (t.epicId === id ? { ...t, epicId: undefined } : t));
    data.goals = data.goals.map((g) => (g.epicId === id ? { ...g, epicId: undefined } : g));

    if (data.epics.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Tag Methods ---
  public getTags(): Tag[] {
    return this.getData().tags;
  }

  public async createTag(name: string, color: string): Promise<Tag> {
    const data = this.getData();
    const newTag: Tag = {
      id: `tag-${Date.now().toString(36)}`,
      name,
      color,
    };
    data.tags.push(newTag);
    await this.persist();
    return newTag;
  }

  public async deleteTag(id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.tags.length;
    data.tags = data.tags.filter((t) => t.id !== id);

    // Remove tag ID from tasks
    data.tasks = data.tasks.map((t) => ({
      ...t,
      tags: t.tags.filter((tagId) => tagId !== id),
    }));

    if (data.tags.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Email Config & Logs ---
  public getEmailConfig(): EmailNotificationConfig {
    return this.getData().emailConfig;
  }

  public async updateEmailConfig(updates: Partial<EmailNotificationConfig>): Promise<EmailNotificationConfig> {
    const data = this.getData();
    data.emailConfig = {
      ...data.emailConfig,
      ...updates,
    };
    await this.persist();
    return data.emailConfig;
  }

  public getEmailLogs(): EmailLog[] {
    return this.getData().emailLogs;
  }

  public async addEmailLog(log: EmailLog): Promise<EmailLog> {
    const data = this.getData();
    data.emailLogs.unshift(log); // Prepend so newest is first
    // Limit to 100 logs
    if (data.emailLogs.length > 100) {
      data.emailLogs = data.emailLogs.slice(0, 100);
    }
    await this.persist();
    return log;
  }
}

export const db = new DatabaseService();

