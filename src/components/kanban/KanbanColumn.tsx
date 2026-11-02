import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, Eye, AlertOctagon, ListPlus } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { KanbanCard } from './KanbanCard';
import { useTaskFlow } from '../../context/TaskFlowContext';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
}

const statusMeta: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string; border: string; bg: string }
> = {
  planejando: {
    label: 'Planejando',
    icon: <ListPlus className="w-4 h-4 text-blue-400" />,
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
  },
  fazendo: {
    label: 'Fazendo',
    icon: <Clock className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/20',
  },
  revisando: {
    label: 'Revisando',
    icon: <Eye className="w-4 h-4 text-purple-400" />,
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-950/20',
  },
  concluido: {
    label: 'Concluído',
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/20',
  },
  bloqueado: {
    label: 'Bloqueado',
    icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-950/20',
  },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, title, tasks, onDropTask }) => {
  const { openModal } = useTaskFlow();
  const [isOver, setIsOver] = useState(false);
  const meta = statusMeta[status];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-xl bg-[#0d1117] border transition-all min-w-[280px] max-w-[340px] flex-1 ${
        isOver
          ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20 bg-[#161b22]'
          : 'border-[#30363d]'
      }`}
    >
      {/* Column Header */}
      <div className={`p-3.5 border-b border-[#30363d] rounded-t-xl flex items-center justify-between ${meta.bg}`}>
        <div className="flex items-center gap-2">
          {meta.icon}
          <h3 className={`font-semibold text-sm ${meta.color}`}>{title}</h3>
          <span className="text-xs font-mono font-medium bg-[#161b22] px-2 py-0.5 rounded-full text-gray-300 border border-[#30363d]">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => openModal('task', { status })}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
          title={`Adicionar tarefa em ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Scroll Area */}
      <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[160px]">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onDragStart={handleDragStart} />
        ))}

        {tasks.length === 0 && (
          <div className="h-28 border border-dashed border-[#30363d] rounded-lg flex flex-col items-center justify-center text-xs text-gray-500 p-3 text-center">
            <span>Nenhuma tarefa aqui</span>
            <button
              onClick={() => openModal('task', { status })}
              className="mt-1 text-blue-400 hover:underline"
            >
              + Adicionar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
