export type GoalType = 'annual' | 'monthly' | 'weekly';

export type TaskStatus = 'planejando' | 'fazendo' | 'revisando' | 'concluido' | 'bloqueado';

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Epic {
  id: string;
  title: string;
  description: string;
  vision: string;
  color: string;
  iconName?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  parentId?: string; // Monthly points to Annual; Weekly points to Monthly
  epicId?: string; // Linked Life Area / Epic
  period: string; // e.g. "2026", "2026-11", "2026-W45"
  progress?: number; // 0-100 calculated dynamically
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM -> If present, treated as an EVENT (agendado)
  recurrence: Recurrence;
  tags: string[]; // Tag IDs
  epicId?: string; // Associated Epic / Spec
  goalId?: string; // Associated Goal
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  targetEmail: string;
  dailyDigestTime: string; // "08:00"
  eventReminderMinutes: number; // 30
  sendOnBlocked: boolean;
  lastDigestSent?: string;
}

export interface EmailLog {
  id: string;
  type: 'daily_digest' | 'event_reminder' | 'blocked_alert';
  recipient: string;
  subject: string;
  summary: string;
  contentHtml: string;
  sentAt: string;
  status: 'simulado' | 'enviado';
}

export interface CliCommandOutput {
  id: string;
  command: string;
  timestamp: string;
  isError?: boolean;
  isJson?: boolean;
  output: string;
  jsonData?: unknown;
}

export type ActiveView = 'kanban' | 'list' | 'calendar' | 'goals' | 'epics';
