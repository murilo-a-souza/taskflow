import React from 'react';
import {
  Layers,
  Plus,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Activity,
  Coins,
  Cpu,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { Epic } from '../../types';

export const EpicsView: React.FC = () => {
  const { epics, goals, tasks, openModal, deleteEpic } = useTaskFlow();

  const getIcon = (name?: string, color?: string) => {
    const props = { className: 'w-5 h-5', style: { color } };
    switch (name) {
      case 'Cpu':
        return <Cpu {...props} />;
      case 'Coins':
        return <Coins {...props} />;
      case 'Activity':
        return <Activity {...props} />;
      case 'HeartHandshake':
        return <HeartHandshake {...props} />;
      case 'BookOpen':
        return <BookOpen {...props} />;
      default:
        return <Layers {...props} />;
    }
  };

  const handleDelete = (epic: Epic) => {
    if (window.confirm(`Deseja excluir a área/épico "${epic.title}"? Tarefas associadas perderão o vínculo.`)) {
      deleteEpic(epic.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Épicos & Specs (Áreas Fundamentais de Vida)</h2>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            As áreas mestras organizam como as diferentes dimensões da sua vida operam (Carreira, Finanças, Saúde, Igreja, Estudos), unindo objetivos estratégicos com execução diária sem atrito.
          </p>
        </div>

        <button
          onClick={() => openModal('epic')}
          className="tf-btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Área / Épico</span>
        </button>
      </div>

      {/* Grid of Epics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {epics.map((epic) => {
          const epicGoals = goals.filter((g) => g.epicId === epic.id);
          const epicTasks = tasks.filter((t) => t.epicId === epic.id);
          const completedTasks = epicTasks.filter((t) => t.status === 'concluido');
          const completionRate =
            epicTasks.length > 0 ? Math.round((completedTasks.length / epicTasks.length) * 100) : 0;

          return (
            <div
              key={epic.id}
              className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col justify-between hover:border-gray-500 transition-all space-y-4 shadow-sm"
            >
              {/* Top: Icon + Title + Actions */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: `${epic.color}15`,
                        borderColor: `${epic.color}40`,
                      }}
                    >
                      {getIcon(epic.iconName, epic.color)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{epic.title}</h3>
                      <span className="text-[10px] font-mono text-gray-500">ID: {epic.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal('epic', epic)}
                      className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#21262d]"
                      title="Editar Épico"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(epic)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-950/20"
                      title="Excluir Épico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description & Vision */}
                <p className="text-xs text-gray-300 leading-relaxed mb-2">{epic.description}</p>
                <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d] text-xs text-emerald-400/90 mb-4">
                  <strong className="text-[10px] uppercase tracking-wider block text-gray-400 mb-0.5">
                    Visão de Sucesso:
                  </strong>
                  {epic.vision}
                </div>

                {/* Linked Goals preview */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-gray-300">
                      Metas Atreladas ({epicGoals.length})
                    </span>
                    <button
                      onClick={() => openModal('goal', { epicId: epic.id })}
                      className="text-blue-400 hover:underline text-[11px]"
                    >
                      + Vincular Meta
                    </button>
                  </div>
                  <div className="space-y-1">
                    {epicGoals.slice(0, 3).map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-2 rounded bg-[#0d1117] text-xs border border-[#21262d]"
                      >
                        <span className="truncate text-gray-200">
                          [{g.type.slice(0, 3).toUpperCase()}] {g.title}
                        </span>
                        <span className="font-mono text-blue-400 font-bold shrink-0 ml-2">
                          {g.progress ?? 0}%
                        </span>
                      </div>
                    ))}
                    {epicGoals.length === 0 && (
                      <p className="text-xs text-gray-500 italic">Nenhuma meta vinculada ainda.</p>
                    )}
                  </div>
                </div>

                {/* Related Tasks preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-gray-300">
                      Tarefas & Ações ({epicTasks.length})
                    </span>
                    <button
                      onClick={() => openModal('task', { epicId: epic.id })}
                      className="text-emerald-400 hover:underline text-[11px]"
                    >
                      + Nova Tarefa nesta Área
                    </button>
                  </div>

                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {epicTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openModal('task', t)}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-[#21262d] text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              t.status === 'concluido' ? 'bg-emerald-400' : 'bg-blue-400'
                            }`}
                          ></span>
                          <span
                            className={`truncate ${
                              t.status === 'concluido' ? 'line-through text-gray-500' : 'text-gray-300'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 uppercase shrink-0">
                          {t.status}
                        </span>
                      </div>
                    ))}

                    {epicTasks.length === 0 && (
                      <p className="text-xs text-gray-500 italic">Nenhuma tarefa cadastrada nesta área.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Footer */}
              <div className="pt-3 border-t border-[#21262d] flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {completedTasks.length} de {epicTasks.length} tarefas concluídas
                </span>
                <span className="font-mono font-bold text-emerald-400">{completionRate}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
