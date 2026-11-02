import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Repeat,
  Layers,
  Target,
  Tag as TagIcon,
  AlertTriangle,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { Task, TaskStatus, Priority, Recurrence } from '../../types';

export const TaskModal: React.FC = () => {
  const {
    modalState,
    closeModal,
    createTask,
    updateTask,
    deleteTask,
    epics,
    goals,
    tags,
    createTag,
  } = useTaskFlow();

  const isEditing = Boolean(modalState.data?.id);
  const initialTask: Partial<Task> = modalState.data || {};

  const [title, setTitle] = useState(initialTask.title || '');
  const [description, setDescription] = useState(initialTask.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialTask.status || 'planejando');
  const [priority, setPriority] = useState<Priority>(initialTask.priority || 'media');
  const [date, setDate] = useState(
    initialTask.date || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState(initialTask.time || '');
  const [recurrence, setRecurrence] = useState<Recurrence>(initialTask.recurrence || 'none');
  const [epicId, setEpicId] = useState(initialTask.epicId || '');
  const [goalId, setGoalId] = useState(initialTask.goalId || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTask.tags || []);
  const [blockedReason, setBlockedReason] = useState(initialTask.blockedReason || '');

  // Tag creation input
  const [newTagName, setNewTagName] = useState('');

  const isEvent = Boolean(time);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const created = createTag(newTagName.trim().toLowerCase(), randomColor);
    setSelectedTags((prev) => [...prev, created.id]);
    setNewTagName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      date: date || undefined,
      time: time || undefined,
      recurrence,
      tags: selectedTags,
      epicId: epicId || undefined,
      goalId: goalId || undefined,
      blockedReason: status === 'bloqueado' ? blockedReason.trim() : undefined,
    };

    if (isEditing && initialTask.id) {
      updateTask(initialTask.id, taskPayload);
    } else {
      createTask(taskPayload);
    }

    closeModal();
  };

  const handleDelete = () => {
    if (initialTask.id && window.confirm(`Excluir a tarefa "${title}"?`)) {
      deleteTask(initialTask.id);
      closeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">
              {isEditing ? `Editar Tarefa (${initialTask.id})` : 'Nova Tarefa / Evento'}
            </h2>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Título da Tarefa / Evento <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Revisar PR de arquitetura, Reunião de sprint, Treino de corrida..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="tf-input w-full py-2 text-sm"
              autoFocus
            />
          </div>

          {/* Description (Markdown supported) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Descrição Detalhada (Markdown opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Contexto, critérios de aceitação, anotações de Bullet Journal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="tf-input w-full py-2 font-mono text-xs"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="tf-input w-full py-2"
              >
                <option value="planejando">Planejando (Backlog & BuJo)</option>
                <option value="fazendo">Fazendo (Foco do Dia)</option>
                <option value="revisando">Revisando</option>
                <option value="concluido">Concluído</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="tf-input w-full py-2"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Blocked Reason if blocked */}
          {status === 'bloqueado' && (
            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Motivo do Bloqueio / Impedimento</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Aguardando resposta do time de DevOps, sem credencial..."
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                className="tf-input w-full border-red-500/40"
              />
            </div>
          )}

          {/* Date, Time & Recurrence (Concept Distinction) */}
          <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Agendamento & Filosofia de Tempo</span>
              </span>

              {isEvent ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ⏰ EVENTO COM HORA
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  🎯 FLUXO DIÁRIO (BUJO)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Data (opcional)</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="tf-input w-full py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Horário (opcional)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="tf-input w-full py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Repetição</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                  className="tf-input w-full py-1.5"
                >
                  <option value="none">Nenhuma</option>
                  <option value="daily">Diária</option>
                  <option value="weekdays">Dias úteis</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed italic">
              {isEvent
                ? '⚡ Como tem horário, é considerado um Evento com lembrete automático disparado 30 minutos antes.'
                : '💡 Sem horário marcado: prioriza o fluxo de trabalho diário sobre prazos rígidos, como no Bullet Journal clássico.'}
            </p>
          </div>

          {/* Epic & Goal Linking (Traceability) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Área Fundamental / Épico</span>
              </label>
              <select
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                className="tf-input w-full py-2"
              >
                <option value="">Nenhum (Geral)</option>
                {epics.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Meta Vinculada (Cascata)</span>
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="tf-input w-full py-2"
              >
                <option value="">Nenhuma</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.type.slice(0, 3).toUpperCase()}] {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
              <TagIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Marcadores / Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => {
                const isSelected = selectedTags.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => handleToggleTag(t.id)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-all ${
                      isSelected
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                        : 'bg-[#0d1117] text-gray-400 border-[#30363d] hover:border-gray-500'
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>

            {/* Quick create tag */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Criar nova tag (ex: infra, dev, reunião)..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="tf-input flex-1 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleCreateNewTag}
                className="tf-btn-secondary text-xs px-2.5 py-1"
              >
                + Adicionar Tag
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#30363d] flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs px-2 py-1.5 rounded hover:bg-red-950/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="tf-btn-secondary text-xs py-1.5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="tf-btn-primary text-xs py-1.5 px-4 font-semibold"
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
