import fs from 'fs';
import { config } from '../config';
import {
  Task,
  Goal,
  Epic,
  Tag,
  EmailNotificationConfig,
  EmailLog,
  User,
} from '../../src/types';
import {
  initialTasks,
  initialGoals,
  initialEpics,
  initialTags,
  initialEmailConfig,
} from '../../src/services/mockData';

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  tasks: Task[];
  goals: Goal[];
  epics: Epic[];
  tags: Tag[];
  emailConfigs?: Record<string, EmailNotificationConfig>; // Keyed by userId
  emailConfig: EmailNotificationConfig; // Global default fallback
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
          users: [],
          tasks: initialTasks,
          goals: initialGoals,
          epics: initialEpics,
          tags: initialTags,
          emailConfigs: {},
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
            users: Array.isArray(parsed.users) ? parsed.users : [],
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : initialTasks,
            goals: Array.isArray(parsed.goals) ? parsed.goals : initialGoals,
            epics: Array.isArray(parsed.epics) ? parsed.epics : initialEpics,
            tags: Array.isArray(parsed.tags) ? parsed.tags : initialTags,
            emailConfigs: parsed.emailConfigs || {},
            emailConfig: parsed.emailConfig || initialEmailConfig,
            emailLogs: Array.isArray(parsed.emailLogs) ? parsed.emailLogs : [],
          };
        } catch {
          const fallbackData: DatabaseSchema = {
            users: [],
            tasks: initialTasks,
            goals: initialGoals,
            epics: initialEpics,
            tags: initialTags,
            emailConfigs: {},
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
        users: [],
        tasks: initialTasks,
        goals: initialGoals,
        epics: initialEpics,
        tags: initialTags,
        emailConfigs: {},
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

  // --- User Methods ---
  public getUsers(): StoredUser[] {
    return this.getData().users;
  }

  public findUserByEmail(email: string): StoredUser | undefined {
    const normalized = email.trim().toLowerCase();
    return this.getData().users.find((u) => u.email.toLowerCase() === normalized);
  }

  public findUserById(id: string): StoredUser | undefined {
    return this.getData().users.find((u) => u.id === id);
  }

  public async createUser(
    name: string,
    email: string,
    passwordHash: string,
    salt: string
  ): Promise<User> {
    const data = this.getData();
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const storedUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      createdAt: now,
    };

    data.users.push(storedUser);

    // Seed default Epics for new user
    const userEpics: Epic[] = initialEpics.map((epic) => ({
      ...epic,
      id: `epic_${userId.slice(-4)}_${epic.id.replace('epic-', '')}`,
      userId,
      createdAt: now.split('T')[0],
    }));
    data.epics.push(...userEpics);

    // Seed default Tags for new user
    const userTags: Tag[] = initialTags.map((tag) => ({
      ...tag,
      id: `tag_${userId.slice(-4)}_${tag.name}`,
      userId,
    }));
    data.tags.push(...userTags);

    // Seed default Email Config for new user
    if (!data.emailConfigs) data.emailConfigs = {};
    data.emailConfigs[userId] = {
      ...initialEmailConfig,
      userId,
      targetEmail: storedUser.email,
    };

    // Seed welcoming onboarding tasks
    const welcomeTasks: Task[] = [
      {
        id: `TF-${Math.floor(100 + Math.random() * 800)}`,
        userId,
        title: 'Explorar o quadro Kanban e mover seu primeiro card',
        description: 'Arraste este cartão para "Fazendo" e depois para "Concluído"!',
        status: 'fazendo',
        priority: 'alta',
        date: now.split('T')[0],
        recurrence: 'none',
        tags: [userTags[0].id],
        epicId: userEpics[0].id,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `TF-${Math.floor(100 + Math.random() * 800)}`,
        userId,
        title: 'Abrir o Terminal CLI integrado (Ctrl + ~)',
        description: 'Pressione Ctrl + ~ ou clique em CLI no topo para rodar comandos como "help" e "task list --json".',
        status: 'planejando',
        priority: 'media',
        date: now.split('T')[0],
        recurrence: 'none',
        tags: [userTags[1]?.id || userTags[0].id],
        epicId: userEpics[0].id,
        createdAt: now,
        updatedAt: now,
      },
    ];
    data.tasks.push(...welcomeTasks);

    await this.persist();

    return {
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      createdAt: storedUser.createdAt,
    };
  }

  // --- Task Methods (User-Scoped) ---
  public getTasks(userId?: string): Task[] {
    const tasks = this.getData().tasks;
    if (!userId) return tasks;
    return tasks.filter((t) => !t.userId || t.userId === userId);
  }

  public getTaskById(id: string, userId?: string): Task | undefined {
    return this.getData().tasks.find((t) => t.id === id && (!userId || !t.userId || t.userId === userId));
  }

  public async createTask(
    userId: string,
    taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    const data = this.getData();
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
      userId,
      id: `TF-${nextNum}`,
      createdAt: now,
      updatedAt: now,
    };

    data.tasks.push(newTask);
    await this.persist();
    return newTask;
  }

  public async updateTask(
    userId: string,
    id: string,
    updates: Partial<Task>
  ): Promise<Task | null> {
    const data = this.getData();
    const index = data.tasks.findIndex((t) => t.id === id && (!t.userId || t.userId === userId));
    if (index === -1) return null;

    const existing = data.tasks[index];
    const now = new Date().toISOString();
    const updated: Task = {
      ...existing,
      ...updates,
      userId: existing.userId || userId,
      id: existing.id,
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

  public async deleteTask(userId: string, id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.tasks.length;
    data.tasks = data.tasks.filter((t) => !(t.id === id && (!t.userId || t.userId === userId)));
    if (data.tasks.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  public async batchUpdateTasks(
    userId: string,
    ids: string[],
    updates: Partial<Task>
  ): Promise<Task[]> {
    const data = this.getData();
    const now = new Date().toISOString();
    const updatedTasks: Task[] = [];

    data.tasks = data.tasks.map((t) => {
      if (ids.includes(t.id) && (!t.userId || t.userId === userId)) {
        const updated: Task = {
          ...t,
          ...updates,
          userId: t.userId || userId,
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

  public async batchDeleteTasks(userId: string, ids: string[]): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.tasks.length;
    data.tasks = data.tasks.filter((t) => !(ids.includes(t.id) && (!t.userId || t.userId === userId)));
    if (data.tasks.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Goal Methods (User-Scoped) ---
  public getGoals(userId?: string): Goal[] {
    const goals = this.getData().goals;
    if (!userId) return goals;
    return goals.filter((g) => !g.userId || g.userId === userId);
  }

  public async createGoal(
    userId: string,
    goalInput: Omit<Goal, 'id' | 'createdAt'>
  ): Promise<Goal> {
    const data = this.getData();
    const newGoal: Goal = {
      ...goalInput,
      userId,
      id: `goal-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    data.goals.push(newGoal);
    await this.persist();
    return newGoal;
  }

  public async updateGoal(
    userId: string,
    id: string,
    updates: Partial<Goal>
  ): Promise<Goal | null> {
    const data = this.getData();
    const index = data.goals.findIndex((g) => g.id === id && (!g.userId || g.userId === userId));
    if (index === -1) return null;

    data.goals[index] = {
      ...data.goals[index],
      ...updates,
      userId: data.goals[index].userId || userId,
      id: data.goals[index].id,
    };
    await this.persist();
    return data.goals[index];
  }

  public async deleteGoal(userId: string, id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.goals.length;
    data.goals = data.goals.filter((g) => !(g.id === id && (!g.userId || g.userId === userId)));

    // Unlink child tasks gracefully
    data.tasks = data.tasks.map((t) =>
      t.goalId === id && (!t.userId || t.userId === userId) ? { ...t, goalId: undefined } : t
    );

    if (data.goals.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Epic Methods (User-Scoped) ---
  public getEpics(userId?: string): Epic[] {
    const epics = this.getData().epics;
    if (!userId) return epics;
    return epics.filter((e) => !e.userId || e.userId === userId);
  }

  public async createEpic(
    userId: string,
    epicInput: Omit<Epic, 'id' | 'createdAt'>
  ): Promise<Epic> {
    const data = this.getData();
    const newEpic: Epic = {
      ...epicInput,
      userId,
      id: `epic-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    data.epics.push(newEpic);
    await this.persist();
    return newEpic;
  }

  public async updateEpic(
    userId: string,
    id: string,
    updates: Partial<Epic>
  ): Promise<Epic | null> {
    const data = this.getData();
    const index = data.epics.findIndex((e) => e.id === id && (!e.userId || e.userId === userId));
    if (index === -1) return null;

    data.epics[index] = {
      ...data.epics[index],
      ...updates,
      userId: data.epics[index].userId || userId,
      id: data.epics[index].id,
    };
    await this.persist();
    return data.epics[index];
  }

  public async deleteEpic(userId: string, id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.epics.length;
    data.epics = data.epics.filter((e) => !(e.id === id && (!e.userId || e.userId === userId)));

    data.tasks = data.tasks.map((t) =>
      t.epicId === id && (!t.userId || t.userId === userId) ? { ...t, epicId: undefined } : t
    );
    data.goals = data.goals.map((g) =>
      g.epicId === id && (!g.userId || g.userId === userId) ? { ...g, epicId: undefined } : g
    );

    if (data.epics.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Tag Methods (User-Scoped) ---
  public getTags(userId?: string): Tag[] {
    const tags = this.getData().tags;
    if (!userId) return tags;
    return tags.filter((t) => !t.userId || t.userId === userId);
  }

  public async createTag(userId: string, name: string, color: string): Promise<Tag> {
    const data = this.getData();
    const newTag: Tag = {
      id: `tag-${Date.now().toString(36)}`,
      userId,
      name,
      color,
    };
    data.tags.push(newTag);
    await this.persist();
    return newTag;
  }

  public async deleteTag(userId: string, id: string): Promise<boolean> {
    const data = this.getData();
    const initialLength = data.tags.length;
    data.tags = data.tags.filter((t) => !(t.id === id && (!t.userId || t.userId === userId)));

    data.tasks = data.tasks.map((t) => {
      if (!t.userId || t.userId === userId) {
        return {
          ...t,
          tags: t.tags.filter((tagId) => tagId !== id),
        };
      }
      return t;
    });

    if (data.tags.length !== initialLength) {
      await this.persist();
      return true;
    }
    return false;
  }

  // --- Email Config & Logs (User-Scoped) ---
  public getEmailConfig(userId?: string): EmailNotificationConfig {
    const data = this.getData();
    if (userId && data.emailConfigs && data.emailConfigs[userId]) {
      return data.emailConfigs[userId];
    }
    return data.emailConfig;
  }

  public async updateEmailConfig(
    userId: string | undefined,
    updates: Partial<EmailNotificationConfig>
  ): Promise<EmailNotificationConfig> {
    const data = this.getData();
    if (userId) {
      if (!data.emailConfigs) data.emailConfigs = {};
      data.emailConfigs[userId] = {
        ...(data.emailConfigs[userId] || data.emailConfig),
        ...updates,
        userId,
      };
      await this.persist();
      return data.emailConfigs[userId];
    }

    data.emailConfig = {
      ...data.emailConfig,
      ...updates,
    };
    await this.persist();
    return data.emailConfig;
  }

  public getEmailLogs(userId?: string): EmailLog[] {
    const logs = this.getData().emailLogs;
    if (!userId) return logs;
    return logs.filter((l) => !l.userId || l.userId === userId);
  }

  public async addEmailLog(log: EmailLog): Promise<EmailLog> {
    const data = this.getData();
    data.emailLogs.unshift(log);
    if (data.emailLogs.length > 100) {
      data.emailLogs = data.emailLogs.slice(0, 100);
    }
    await this.persist();
    return log;
  }
}

export const db = new DatabaseService();
