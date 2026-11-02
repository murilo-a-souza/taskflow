import React from 'react';
import {
  Clock,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { useTaskFlow } from '../../context/TaskFlowContext';

interface KanbanCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onDragStart }) => {
  const { epics, goals, tags, openModal, moveTaskStatus, deleteTask } = useTaskFlow();

  const epic = epics.find((e) => e.id === task.epicId);
  const goal = goals.find((g) => g.id === task.goalId);
  const taskTags = tags.filter((t) => task.tags.includes(t.id));

  const priorityColors = {
    urgente: 'bg-red-500/10 text-red-400 border-red-500/30',
    alta: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    media: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    baixa: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const nextStatusMap: Record<TaskStatus, TaskStatus> = {
    planejando: 'fazendo',
    fazendo: 'revisando',
    revisando: 'concluido',
    concluido: 'planejando',
    bloqueado: 'planejando',
  };

  const isEvent = Boolean(task.time);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => openModal('task', task)}
      className={`group tf-card p-3.5 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all relative ${
        task.status === 'bloqueado' ? 'border-red-500/40 bg-red-950/10' : ''
      }`}
    >
      {/* Top row: ID + Epic badge + Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-gray-500 group-hover:text-blue-400 font-semibold">
            {task.id}
          </span>
          {epic && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border truncate max-w-[130px]"
              style={{
                backgroundColor: `${epic.color}15`,
                borderColor: `${epic.color}40`,
                color: epic.color,
              }}
              title={`Área / Épico: ${epic.title}`}
            >
              {epic.title}
            </span>
          )}
        </div>

        <span
          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-100 group-hover:text-white leading-snug mb-1.5">
        {task.title}
      </h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2.5 leading-relaxed font-normal">
          {task.description}
        </p>
      )}

      {/* Blocked Reason Alert */}
      {task.status === 'bloqueado' && task.blockedReason && (
        <div className="mb-2.5 p-2 bg-red-950/40 border border-red-500/30 rounded text-[11px] text-red-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{task.blockedReason}</span>
        </div>
      )}

      {/* Goal connection (Cascading Link) */}
      {goal && (
        <div className="flex items-center gap-1.5 text-[11px] text-blue-400/90 bg-blue-950/30 border border-blue-500/20 px-2 py-1 rounded mb-2.5 truncate">
          <span className="text-[9px] uppercase font-bold tracking-wider bg-blue-500/20 px-1 rounded text-blue-300">
            {goal.type}
          </span>
          <span className="truncate">{goal.title}</span>
        </div>
      )}

      {/* Tags row */}
      {taskTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {taskTags.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-gray-300 border border-[#30363d]"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: Event vs Flow + Date + Recurrence + Quick Move */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#21262d]">
        <div className="flex items-center gap-2">
          {isEvent ? (
            <span
              className="flex items-center gap-1 text-amber-400 font-mono font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
              title="Evento com hora marcada"
            >
              <Clock className="w-3 h-3" />
              <span>{task.time}</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-gray-400 text-[10px] font-medium"
              title="Tarefa de fluxo contínuo (Bullet Journal)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Fluxo</span>
            </span>
          )}

          {task.date && (
            <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              {task.date.slice(5)}
            </span>
          )}

          {task.recurrence !== 'none' && (
            <span
              className="text-purple-400 text-[10px] flex items-center gap-0.5"
              title={`Repetição: ${task.recurrence}`}
            >
              <Repeat className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Quick Advance Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            moveTaskStatus(task.id, nextStatusMap[task.status]);
          }}
          className="text-xs p-1 text-gray-400 hover:text-white hover:bg-[#30363d] rounded transition-colors flex items-center gap-1"
          title={`Avançar para: ${nextStatusMap[task.status]}`}
        >
          <span className="text-[10px] uppercase font-semibold hidden group-hover:inline">
            {nextStatusMap[task.status]}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </div>
    </div>
  );
};
