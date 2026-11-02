import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  Layers,
  Target,
  ArrowRight,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { Task, TaskStatus, Priority } from '../../types';

export const ListView: React.FC = () => {
  const {
    filteredTasks,
    epics,
    goals,
    tags,
    openModal,
    moveTaskStatus,
    batchUpdateTasks,
    batchDeleteTasks,
  } = useTaskFlow();

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'status' | 'epic' | 'priority'>('status');

  const toggleSelectTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  // Batch actions
  const handleBatchStatus = (newStatus: TaskStatus) => {
    batchUpdateTasks(selectedTaskIds, { status: newStatus });
    setSelectedTaskIds([]);
  };

  const handleBatchDelete = () => {
    if (window.confirm(`Excluir permanentemente ${selectedTaskIds.length} tarefas selecionadas?`)) {
      batchDeleteTasks(selectedTaskIds);
      setSelectedTaskIds([]);
    }
  };

  // Grouping logic
  interface TaskGroup {
    key: string;
    label: string;
    color?: string;
    items: Task[];
  }

  const getGroups = (): TaskGroup[] => {
    if (groupBy === 'epic') {
      const groups: TaskGroup[] = [];
      for (const epic of epics) {
        const items = filteredTasks.filter((t) => t.epicId === epic.id);
        if (items.length > 0) {
          groups.push({ key: epic.id, label: epic.title, color: epic.color, items });
        }
      }
      const unassigned = filteredTasks.filter((t) => !t.epicId);
      if (unassigned.length > 0) {
        groups.push({ key: 'unassigned', label: 'Sem Área / Épico', items: unassigned });
      }
      return groups;
    }

    if (groupBy === 'priority') {
      const priorities: Priority[] = ['urgente', 'alta', 'media', 'baixa'];
      return priorities
        .map((p) => ({
          key: p,
          label: `Prioridade ${p.toUpperCase()}`,
          color:
            p === 'urgente'
              ? '#ef4444'
              : p === 'alta'
              ? '#f59e0b'
              : p === 'media'
              ? '#eab308'
              : '#3b82f6',
          items: filteredTasks.filter((t) => t.priority === p),
        }))
        .filter((g) => g.items.length > 0);
    }

    // Default by status
    const statuses: { key: TaskStatus; label: string; color?: string }[] = [
      { key: 'fazendo', label: 'Em Andamento (Foco Diário)', color: '#f59e0b' },
      { key: 'planejando', label: 'Planejando (Backlog & BuJo)', color: '#3b82f6' },
      { key: 'revisando', label: 'Em Revisão', color: '#a855f7' },
      { key: 'bloqueado', label: 'Bloqueado', color: '#ef4444' },
      { key: 'concluido', label: 'Concluído', color: '#10b981' },
    ];

    return statuses
      .map((s) => ({
        key: s.key,
        label: s.label,
        color: s.color,
        items: filteredTasks.filter((t) => t.status === s.key),
      }))
      .filter((g) => g.items.length > 0);
  };

  const groups = getGroups();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Top Controls: Grouping + Select All + Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] p-3 rounded-xl border border-[#30363d]">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white px-2 py-1 rounded bg-[#21262d] border border-[#30363d]"
          >
            {selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.length ? (
              <CheckSquare className="w-4 h-4 text-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            <span>
              {selectedTaskIds.length > 0
                ? `${selectedTaskIds.length} selecionadas`
                : 'Selecionar todas'}
            </span>
          </button>

          <span className="text-xs text-gray-400">
            Total: <strong>{filteredTasks.length}</strong> tarefas
          </span>
        </div>

        {/* Group By selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Agrupar por:</span>
          <div className="flex bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setGroupBy('status')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                groupBy === 'status' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Status
            </button>
            <button
              onClick={() => setGroupBy('epic')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                groupBy === 'epic' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Área / Épico
            </button>
            <button
              onClick={() => setGroupBy('priority')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                groupBy === 'priority'
                  ? 'bg-[#21262d] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Prioridade
            </button>
          </div>
        </div>
      </div>

      {/* Floating Batch Action Bar when items selected */}
      {selectedTaskIds.length > 0 && (
        <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 bg-blue-950 border border-blue-500/50 p-3 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-blue-200 font-medium">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>
              <strong>{selectedTaskIds.length}</strong> tarefas selecionadas:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBatchStatus('concluido')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>

            <button
              onClick={() => handleBatchStatus('fazendo')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mover p/ Fazendo</span>
            </button>

            <button
              onClick={() => handleBatchStatus('planejando')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-white font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mover p/ Planejando</span>
            </button>

            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-red-600 hover:bg-red-500 text-white font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>

            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-xs text-gray-400 hover:text-white px-2 py-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Task Groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key} className="space-y-2">
            {/* Group Header */}
            <div className="flex items-center gap-2 pb-1 border-b border-[#30363d]/70">
              {group.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: group.color }}
                ></span>
              )}
              <h3 className="font-semibold text-sm text-gray-200 tracking-tight">
                {group.label}
              </h3>
              <span className="text-xs font-mono text-gray-500">({group.items.length})</span>
            </div>

            {/* Tasks in Group */}
            <div className="space-y-1.5">
              {group.items.map((task) => {
                const isSelected = selectedTaskIds.includes(task.id);
                const epic = epics.find((e) => e.id === task.epicId);
                const goal = goals.find((g) => g.id === task.goalId);
                const isEvent = Boolean(task.time);

                // Bullet journal signifier
                const bujoBullet =
                  task.status === 'concluido' ? (
                    <span className="text-emerald-400 font-bold">✓</span>
                  ) : isEvent ? (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  ) : task.priority === 'urgente' ? (
                    <span className="text-red-400 font-bold">!</span>
                  ) : (
                    <span className="text-blue-400 font-bold">●</span>
                  );

                return (
                  <div
                    key={task.id}
                    onClick={() => openModal('task', task)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-500/50'
                        : 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d]'
                    }`}
                  >
                    {/* Left: Checkbox + BuJo symbol + ID + Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                      <button
                        onClick={(e) => toggleSelectTask(task.id, e)}
                        className="text-gray-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      <div className="w-5 flex items-center justify-center shrink-0" title="Bullet Journal Signifier">
                        {bujoBullet}
                      </div>

                      <span className="text-xs font-mono text-gray-500 shrink-0 font-semibold">
                        {task.id}
                      </span>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-sm font-medium ${
                            task.status === 'concluido'
                              ? 'line-through text-gray-500'
                              : 'text-gray-200'
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.status === 'bloqueado' && task.blockedReason && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Bloqueado: {task.blockedReason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Meta indicators */}
                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      {isEvent ? (
                        <span className="flex items-center gap-1 font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          <span>{task.time}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 hidden sm:inline">
                          Fluxo Contínuo
                        </span>
                      )}

                      {epic && (
                        <span
                          className="hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border truncate max-w-[120px]"
                          style={{
                            backgroundColor: `${epic.color}15`,
                            borderColor: `${epic.color}30`,
                            color: epic.color,
                          }}
                        >
                          {epic.title}
                        </span>
                      )}

                      {goal && (
                        <span className="hidden lg:inline-flex text-[10px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20 truncate max-w-[130px]">
                          {goal.title}
                        </span>
                      )}

                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          task.status === 'concluido'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : task.status === 'fazendo'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}
                      >
                        {task.status}
                      </span>

                      {/* Quick check toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTaskStatus(
                            task.id,
                            task.status === 'concluido' ? 'planejando' : 'concluido'
                          );
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          task.status === 'concluido'
                            ? 'text-emerald-400 hover:bg-emerald-950/40'
                            : 'text-gray-400 hover:text-white hover:bg-[#30363d]'
                        }`}
                        title={
                          task.status === 'concluido'
                            ? 'Reabrir tarefa'
                            : 'Marcar como concluída (✓)'
                        }
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="py-16 text-center text-gray-500 bg-[#161b22] rounded-xl border border-[#30363d]">
            <p className="text-sm">Nenhuma tarefa encontrada com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
