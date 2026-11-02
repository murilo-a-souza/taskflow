import {
  Task,
  Goal,
  Epic,
  Tag,
  EmailNotificationConfig,
  EmailLog,
  TaskStatus,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json();

  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Erro HTTP ${response.status} em ${endpoint}`);
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Bootstrap
  async getBootstrap(): Promise<{
    tasks: Task[];
    goals: Goal[];
    epics: Epic[];
    tags: Tag[];
    emailConfig: EmailNotificationConfig;
    emailLogs: EmailLog[];
  }> {
    return request('/bootstrap');
  },

  // Tasks
  async getTasks(params?: Record<string, string>): Promise<Task[]> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request(`/tasks${query}`);
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateTaskStatus(id: string, status: TaskStatus, blockedReason?: string): Promise<Task> {
    return request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, blockedReason }),
    });
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async batchUpdateTasks(ids: string[], updates: Partial<Task>): Promise<Task[]> {
    return request('/tasks/batch', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', ids, updates }),
    });
  },

  async batchDeleteTasks(ids: string[]): Promise<boolean> {
    return request('/tasks/batch', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', ids }),
    });
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    return request('/goals');
  },

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    return request('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    return request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteGoal(id: string): Promise<void> {
    return request(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  // Epics
  async getEpics(): Promise<Epic[]> {
    return request('/epics');
  },

  async createEpic(epic: Omit<Epic, 'id' | 'createdAt'>): Promise<Epic> {
    return request('/epics', {
      method: 'POST',
      body: JSON.stringify(epic),
    });
  },

  async updateEpic(id: string, updates: Partial<Epic>): Promise<Epic> {
    return request(`/epics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteEpic(id: string): Promise<void> {
    return request(`/epics/${id}`, {
      method: 'DELETE',
    });
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    return request('/tags');
  },

  async createTag(name: string, color: string): Promise<Tag> {
    return request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
  },

  async deleteTag(id: string): Promise<void> {
    return request(`/tags/${id}`, {
      method: 'DELETE',
    });
  },

  // Email Notifications
  async getEmailConfig(): Promise<EmailNotificationConfig> {
    return request('/email/config');
  },

  async updateEmailConfig(cfg: Partial<EmailNotificationConfig>): Promise<EmailNotificationConfig> {
    return request('/email/config', {
      method: 'PUT',
      body: JSON.stringify(cfg),
    });
  },

  async getEmailLogs(): Promise<EmailLog[]> {
    return request('/email/logs');
  },

  async triggerDailyDigest(recipient?: string): Promise<EmailLog> {
    return request('/email/digest', {
      method: 'POST',
      body: JSON.stringify({ recipient }),
    });
  },

  async triggerReminder(taskId: string): Promise<EmailLog> {
    return request(`/email/reminder/${taskId}`, {
      method: 'POST',
    });
  },
};

