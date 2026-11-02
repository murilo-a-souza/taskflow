import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  Goal,
  Epic,
  Tag,
  EmailNotificationConfig,
  EmailLog,
  ActiveView,
  CliCommandOutput,
  TaskStatus,
  Priority,
} from '../types';
import {
  initialEpics,
  initialGoals,
  initialTags,
  initialTasks,
  initialEmailConfig,
} from '../services/mockData';
import { executeCliCommand } from '../services/cliParser';
import { generateDailyDigestHtml, generateEventReminderHtml } from '../services/emailService';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface TaskFlowContextType {
  // Data
  tasks: Task[];
  goals: Goal[];
  epics: Epic[];
  tags: Tag[];
  emailConfig: EmailNotificationConfig;
  emailLogs: EmailLog[];

  // Navigation & UI State
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isCliOpen: boolean;
  setIsCliOpen: (open: boolean) => void;
  toggleCli: () => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedEpicFilter: string;
  setSelectedEpicFilter: (id: string) => void;
  selectedGoalFilter: string;
  setSelectedGoalFilter: (id: string) => void;
  selectedPriorityFilter: string;
  setSelectedPriorityFilter: (p: string) => void;
  selectedTagFilter: string;
  setSelectedTagFilter: (id: string) => void;
  selectedTypeFilter: 'all' | 'events' | 'flow';
  setSelectedTypeFilter: (t: 'all' | 'events' | 'flow') => void;

  // Filtered Tasks
  filteredTasks: Task[];

  // Modals
  modalState: {
    isOpen: boolean;
    type: 'task' | 'goal' | 'epic' | 'tag' | 'email_settings' | 'email_preview' | null;
    data?: any;
  };
  openModal: (type: 'task' | 'goal' | 'epic' | 'tag' | 'email_settings' | 'email_preview', data?: any) => void;
  closeModal: () => void;

  // Task Actions
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => void;
  batchUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  batchDeleteTasks: (ids: string[]) => void;

  // Goal Actions
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Epic Actions
  createEpic: (epic: Omit<Epic, 'id' | 'createdAt'>) => Epic;
  updateEpic: (id: string, updates: Partial<Epic>) => void;
  deleteEpic: (id: string) => void;

  // Tag Actions
  createTag: (name: string, color: string) => Tag;
  deleteTag: (id: string) => void;

  // CLI Engine
  cliOutputs: CliCommandOutput[];
  runCliCommand: (cmd: string) => void;
  clearCli: () => void;

  // Email Notifications
  updateEmailConfig: (cfg: Partial<EmailNotificationConfig>) => void;
  triggerDailyDigestNow: () => EmailLog;
  unreadEmailCount: number;
  resetAllData: () => void;
}

const TaskFlowContext = createContext<TaskFlowContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  TASKS: 'taskflow_tasks_v1',
  GOALS: 'taskflow_goals_v1',
  EPICS: 'taskflow_epics_v1',
  TAGS: 'taskflow_tags_v1',
  EMAIL_CFG: 'taskflow_email_cfg_v1',
  EMAIL_LOGS: 'taskflow_email_logs_v1',
};

export const TaskFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();

  // Load state from localStorage or initial mock data
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [rawGoals, setRawGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.GOALS);
      return saved ? JSON.parse(saved) : initialGoals;
    } catch {
      return initialGoals;
    }
  });

  const [epics, setEpics] = useState<Epic[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.EPICS);
      return saved ? JSON.parse(saved) : initialEpics;
    } catch {
      return initialEpics;
    }
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TAGS);
      return saved ? JSON.parse(saved) : initialTags;
    } catch {
      return initialTags;
    }
  });

  const [emailConfig, setEmailConfig] = useState<EmailNotificationConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.EMAIL_CFG);
      return saved ? JSON.parse(saved) : initialEmailConfig;
    } catch {
      return initialEmailConfig;
    }
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.EMAIL_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI State
  const [activeView, setActiveView] = useState<ActiveView>('kanban');
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'task' | 'goal' | 'epic' | 'tag' | 'email_settings' | 'email_preview' | null;
    data?: any;
  }>({ isOpen: false, type: null });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEpicFilter, setSelectedEpicFilter] = useState('all');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'events' | 'flow'>('all');

  // CLI state
  const [cliOutputs, setCliOutputs] = useState<CliCommandOutput[]>([
    {
      id: 'welcome',
      command: 'init',
      timestamp: new Date().toLocaleTimeString(),
      output:
        '⚡ Bem-vindo ao TaskFlow CLI. Digite "help" para ver a lista de comandos e sintaxe de criação de tarefas.',
    },
  ]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.GOALS, JSON.stringify(rawGoals));
  }, [rawGoals]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EPICS, JSON.stringify(epics));
  }, [epics]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TAGS, JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EMAIL_CFG, JSON.stringify(emailConfig));
  }, [emailConfig]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(emailLogs));
  }, [emailLogs]);

  // Sync with Back-End API on startup and when user changes
  useEffect(() => {
    let isMounted = true;
    api.getBootstrap()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (Array.isArray(data.goals)) setRawGoals(data.goals);
        if (Array.isArray(data.epics)) setEpics(data.epics);
        if (Array.isArray(data.tags)) setTags(data.tags);
        if (data.emailConfig) setEmailConfig(data.emailConfig);
        if (Array.isArray(data.emailLogs)) setEmailLogs(data.emailLogs);
      })
      .catch((err) => {
        console.warn('[TaskFlow] Back-end offline ou indisponível, utilizando cache local:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [token, user?.id]);

  // Keyboard shortcut to toggle terminal (Ctrl + ~ or Ctrl + ')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === "'" || e.key === '~')) {
        e.preventDefault();
        setIsCliOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Cascading Goals Progress dynamically!
  // Weekly goals progress = completed tasks / total tasks linked to weekly goal
  // Monthly goals progress = average of child weekly goals
  // Annual goals progress = average of child monthly goals
  const goals = useMemo(() => {
    // 1. Calculate Weekly Goals progress
    const weeklyGoalsWithProgress = rawGoals.map((goal) => {
      if (goal.type !== 'weekly') return goal;
      const linkedTasks = tasks.filter((t) => t.goalId === goal.id);
      if (linkedTasks.length === 0) {
        return {
          ...goal,
          progress: goal.targetValue ? Math.round(((goal.currentValue || 0) / goal.targetValue) * 100) : 0,
        };
      }
      const completedCount = linkedTasks.filter((t) => t.status === 'concluido').length;
      const calculatedProgress = Math.round((completedCount / linkedTasks.length) * 100);
      return {
        ...goal,
        progress: calculatedProgress,
        currentValue: completedCount,
        targetValue: linkedTasks.length,
        unit: 'tarefas',
      };
    });

    // 2. Calculate Monthly Goals progress based on child Weekly Goals or direct values
    const monthlyGoalsWithProgress = weeklyGoalsWithProgress.map((goal) => {
      if (goal.type !== 'monthly') return goal;
      const childWeekly = weeklyGoalsWithProgress.filter((w) => w.parentId === goal.id);
      if (childWeekly.length > 0) {
        const sumProg = childWeekly.reduce((acc, curr) => acc + (curr.progress || 0), 0);
        return {
          ...goal,
          progress: Math.round(sumProg / childWeekly.length),
        };
      }
      if (goal.targetValue && goal.targetValue > 0) {
        return {
          ...goal,
          progress: Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)),
        };
      }
      return { ...goal, progress: goal.progress || 0 };
    });

    // 3. Calculate Annual Goals progress based on child Monthly Goals
    return monthlyGoalsWithProgress.map((goal) => {
      if (goal.type !== 'annual') return goal;
      const childMonthly = monthlyGoalsWithProgress.filter((m) => m.parentId === goal.id);
      if (childMonthly.length > 0) {
        const sumProg = childMonthly.reduce((acc, curr) => acc + (curr.progress || 0), 0);
        return {
          ...goal,
          progress: Math.round(sumProg / childMonthly.length),
        };
      }
      if (goal.targetValue && goal.targetValue > 0) {
        return {
          ...goal,
          progress: Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)),
        };
      }
      return { ...goal, progress: goal.progress || 0 };
    });
  }, [rawGoals, tasks]);

  // Filter tasks based on search and user dropdowns
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId) return false;
      }

      // Epic
      if (selectedEpicFilter !== 'all' && t.epicId !== selectedEpicFilter) {
        return false;
      }

      // Goal
      if (selectedGoalFilter !== 'all' && t.goalId !== selectedGoalFilter) {
        return false;
      }

      // Priority
      if (selectedPriorityFilter !== 'all' && t.priority !== selectedPriorityFilter) {
        return false;
      }

      // Tag
      if (selectedTagFilter !== 'all' && !t.tags.includes(selectedTagFilter)) {
        return false;
      }

      // Type (Events vs Flow)
      if (selectedTypeFilter === 'events' && !t.time) return false;
      if (selectedTypeFilter === 'flow' && !!t.time) return false;

      return true;
    });
  }, [
    tasks,
    searchQuery,
    selectedEpicFilter,
    selectedGoalFilter,
    selectedPriorityFilter,
    selectedTagFilter,
    selectedTypeFilter,
  ]);

  // Modal controls
  const openModal = useCallback(
    (type: 'task' | 'goal' | 'epic' | 'tag' | 'email_settings' | 'email_preview', data?: any) => {
      setModalState({ isOpen: true, type, data });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, data: undefined });
  }, []);

  const toggleCli = useCallback(() => {
    setIsCliOpen((prev) => !prev);
  }, []);

  // Task CRUD
  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nextId = `TF-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const optimisticTask: Task = {
      ...taskData,
      id: nextId,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [optimisticTask, ...prev]);

    api.createTask(taskData)
      .then((serverTask) => {
        setTasks((prev) => prev.map((t) => (t.id === optimisticTask.id ? serverTask : t)));
      })
      .catch((err) => {
        console.warn('[API] Falha ao sincronizar criação da tarefa no back-end:', err);
      });

    return optimisticTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
          if (updates.status === 'concluido' && t.status !== 'concluido') {
            updated.completedAt = new Date().toISOString();
          }
          return updated;
        }
        return t;
      })
    );
    api.updateTask(id, updates).catch((err) => {
      console.warn('[API] Falha ao sincronizar atualização de tarefa:', err);
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    api.deleteTask(id).catch((err) => {
      console.warn('[API] Falha ao sincronizar exclusão de tarefa:', err);
    });
  }, []);

  const moveTaskStatus = useCallback((id: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            completedAt: newStatus === 'concluido' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
    api.updateTaskStatus(id, newStatus).catch((err) => {
      console.warn('[API] Falha ao sincronizar novo status:', err);
    });
  }, []);

  const batchUpdateTasks = useCallback((ids: string[], updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (ids.includes(t.id)) {
          return { ...t, ...updates, updatedAt: new Date().toISOString() };
        }
        return t;
      })
    );
    api.batchUpdateTasks(ids, updates).catch((err) => {
      console.warn('[API] Falha ao sincronizar atualização em lote:', err);
    });
  }, []);

  const batchDeleteTasks = useCallback((ids: string[]) => {
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    api.batchDeleteTasks(ids).catch((err) => {
      console.warn('[API] Falha ao sincronizar exclusão em lote:', err);
    });
  }, []);

  // Goal CRUD
  const createGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const nextId = `goal-${Date.now().toString().slice(-4)}`;
    const optimisticGoal: Goal = {
      ...goalData,
      id: nextId,
      createdAt: new Date().toISOString(),
    };
    setRawGoals((prev) => [...prev, optimisticGoal]);

    api.createGoal(goalData)
      .then((serverGoal) => {
        setRawGoals((prev) => prev.map((g) => (g.id === optimisticGoal.id ? serverGoal : g)));
      })
      .catch((err) => {
        console.warn('[API] Falha ao sincronizar meta com o back-end:', err);
      });

    return optimisticGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setRawGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    api.updateGoal(id, updates).catch((err) => {
      console.warn('[API] Falha ao sincronizar meta:', err);
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setRawGoals((prev) => prev.filter((g) => g.id !== id));
    // Unlink tasks
    setTasks((prev) => prev.map((t) => (t.goalId === id ? { ...t, goalId: undefined } : t)));
    api.deleteGoal(id).catch((err) => {
      console.warn('[API] Falha ao sincronizar exclusão de meta:', err);
    });
  }, []);

  // Epic CRUD
  const createEpic = useCallback((epicData: Omit<Epic, 'id' | 'createdAt'>) => {
    const nextId = `epic-${Date.now().toString().slice(-4)}`;
    const optimisticEpic: Epic = {
      ...epicData,
      id: nextId,
      createdAt: new Date().toISOString(),
    };
    setEpics((prev) => [...prev, optimisticEpic]);

    api.createEpic(epicData)
      .then((serverEpic) => {
        setEpics((prev) => prev.map((e) => (e.id === optimisticEpic.id ? serverEpic : e)));
      })
      .catch((err) => {
        console.warn('[API] Falha ao sincronizar épico com o back-end:', err);
      });

    return optimisticEpic;
  }, []);

  const updateEpic = useCallback((id: string, updates: Partial<Epic>) => {
    setEpics((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    api.updateEpic(id, updates).catch((err) => {
      console.warn('[API] Falha ao sincronizar atualização de épico:', err);
    });
  }, []);

  const deleteEpic = useCallback((id: string) => {
    setEpics((prev) => prev.filter((e) => e.id !== id));
    // Unlink tasks and goals
    setTasks((prev) => prev.map((t) => (t.epicId === id ? { ...t, epicId: undefined } : t)));
    setRawGoals((prev) => prev.map((g) => (g.epicId === id ? { ...g, epicId: undefined } : g)));
    api.deleteEpic(id).catch((err) => {
      console.warn('[API] Falha ao sincronizar exclusão de épico:', err);
    });
  }, []);

  // Tag CRUD
  const createTag = useCallback((name: string, color: string) => {
    const nextId = `tag-${Date.now().toString().slice(-4)}`;
    const optimisticTag: Tag = { id: nextId, name, color };
    setTags((prev) => [...prev, optimisticTag]);

    api.createTag(name, color)
      .then((serverTag) => {
        setTags((prev) => prev.map((t) => (t.id === optimisticTag.id ? serverTag : t)));
      })
      .catch((err) => {
        console.warn('[API] Falha ao sincronizar tag:', err);
      });

    return optimisticTag;
  }, []);

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    setTasks((prev) => prev.map((t) => ({ ...t, tags: t.tags.filter((tagId) => tagId !== id) })));
    api.deleteTag(id).catch((err) => {
      console.warn('[API] Falha ao sincronizar exclusão de tag:', err);
    });
  }, []);

  // Email Config
  const updateEmailConfig = useCallback((cfg: Partial<EmailNotificationConfig>) => {
    setEmailConfig((prev) => ({ ...prev, ...cfg }));
    api.updateEmailConfig(cfg).catch((err) => {
      console.warn('[API] Falha ao atualizar configuração de e-mail:', err);
    });
  }, []);

  // Trigger Daily Digest
  const triggerDailyDigestNow = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const yesterdayCompleted = tasks.filter(
      (t) => t.status === 'concluido' || (t.completedAt && t.completedAt.startsWith(yesterdayStr))
    );
    const todayTasks = tasks.filter((t) => t.date === todayStr || t.status === 'fazendo');
    const activeWeekly = goals.filter((g) => g.type === 'weekly' && g.status === 'active');

    const digest = generateDailyDigestHtml(
      emailConfig.targetEmail,
      yesterdayCompleted,
      todayTasks,
      activeWeekly,
      epics
    );

    const optimisticLog: EmailLog = {
      id: `log-${Date.now()}`,
      type: 'daily_digest',
      recipient: emailConfig.targetEmail,
      subject: digest.subject,
      summary: digest.summary,
      contentHtml: digest.html,
      sentAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'simulado',
    };

    setEmailLogs((prev) => [optimisticLog, ...prev]);

    // Dispatch via Back-End
    api.triggerDailyDigest(emailConfig.targetEmail)
      .then((serverLog) => {
        setEmailLogs((prev) => prev.map((l) => (l.id === optimisticLog.id ? serverLog : l)));
      })
      .catch((err) => {
        console.warn('[API] Falha ao disparar digest via back-end:', err);
      });

    return optimisticLog;
  }, [tasks, goals, epics, emailConfig]);

  // Run CLI Command
  const runCliCommand = useCallback(
    (cmd: string) => {
      const result = executeCliCommand(cmd, { tasks, goals, epics, tags });

      // Handle executed side effect action
      if (result.action) {
        if (result.action.type === 'create_task') {
          const payload = result.action.payload;
          setTasks((prev) => [payload, ...prev]);
          api.createTask(payload).catch((err) => console.warn('[CLI] Falha ao sincronizar criação:', err));
        } else if (result.action.type === 'update_task') {
          const updated = result.action.payload;
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          api.updateTask(updated.id, updated).catch((err) => console.warn('[CLI] Falha ao sincronizar atualização:', err));
        } else if (result.action.type === 'delete_task') {
          const { id } = result.action.payload;
          setTasks((prev) => prev.filter((t) => t.id !== id));
          api.deleteTask(id).catch((err) => console.warn('[CLI] Falha ao sincronizar exclusão:', err));
        } else if (result.action.type === 'create_goal') {
          const payload = result.action.payload;
          setRawGoals((prev) => [...prev, payload]);
          api.createGoal(payload).catch((err) => console.warn('[CLI] Falha ao sincronizar meta:', err));
        } else if (result.action.type === 'trigger_digest') {
          triggerDailyDigestNow();
        } else if (result.action.type === 'clear') {
          setCliOutputs([]);
          return;
        }
      }

      setCliOutputs((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: cmd,
          timestamp: new Date().toLocaleTimeString(),
          isError: result.isError,
          isJson: result.isJson,
          output: result.output,
          jsonData: result.jsonData,
        },
      ]);
    },
    [tasks, goals, epics, tags, triggerDailyDigestNow]
  );

  const clearCli = useCallback(() => {
    setCliOutputs([]);
  }, []);

  const resetAllData = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TASKS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.GOALS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.EPICS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TAGS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.EMAIL_LOGS);
    setTasks(initialTasks);
    setRawGoals(initialGoals);
    setEpics(initialEpics);
    setTags(initialTags);
    setEmailLogs([]);
  }, []);

  return (
    <TaskFlowContext.Provider
      value={{
        tasks,
        goals,
        epics,
        tags,
        emailConfig,
        emailLogs,
        activeView,
        setActiveView,
        isCliOpen,
        setIsCliOpen,
        toggleCli,
        searchQuery,
        setSearchQuery,
        selectedEpicFilter,
        setSelectedEpicFilter,
        selectedGoalFilter,
        setSelectedGoalFilter,
        selectedPriorityFilter,
        setSelectedPriorityFilter,
        selectedTagFilter,
        setSelectedTagFilter,
        selectedTypeFilter,
        setSelectedTypeFilter,
        filteredTasks,
        modalState,
        openModal,
        closeModal,
        createTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        batchUpdateTasks,
        batchDeleteTasks,
        createGoal,
        updateGoal,
        deleteGoal,
        createEpic,
        updateEpic,
        deleteEpic,
        createTag,
        deleteTag,
        cliOutputs,
        runCliCommand,
        clearCli,
        updateEmailConfig,
        triggerDailyDigestNow,
        unreadEmailCount: emailLogs.length,
        resetAllData,
      }}
    >
      {children}
    </TaskFlowContext.Provider>
  );
};

export const useTaskFlow = () => {
  const context = useContext(TaskFlowContext);
  if (!context) {
    throw new Error('useTaskFlow must be used within a TaskFlowProvider');
  }
  return context;
};
