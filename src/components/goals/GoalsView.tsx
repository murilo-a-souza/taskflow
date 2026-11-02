import React, { useState } from 'react';
import {
  Target,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { Goal, GoalType } from '../../types';

export const GoalsView: React.FC = () => {
  const { goals, epics, tasks, openModal, deleteGoal } = useTaskFlow();
  const [activeTab, setActiveTab] = useState<'cascade' | 'annual' | 'monthly' | 'weekly'>('cascade');

  const annualGoals = goals.filter((g) => g.type === 'annual');
  const monthlyGoals = goals.filter((g) => g.type === 'monthly');
  const weeklyGoals = goals.filter((g) => g.type === 'weekly');

  const getEpic = (epicId?: string) => epics.find((e) => e.id === epicId);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Deseja excluir a meta "${title}"? Tarefas associadas perderão o vínculo.`)) {
      deleteGoal(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#161b22] to-emerald-950/30 p-5 rounded-2xl border border-[#30363d] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Metas em Cascata (Cascading Goals)</h2>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            As <strong className="text-emerald-400">Metas Semanais</strong> conduzem a execução diária e atualizam automaticamente as <strong className="text-blue-400">Metas Mensais</strong>, que por sua vez alimentam as <strong className="text-purple-400">Metas Anuais</strong> de longo prazo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('goal')}
            className="tf-btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-[#30363d] space-x-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('cascade')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'cascade'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Visão Cascata Completa (Árvore)
        </button>
        <button
          onClick={() => setActiveTab('annual')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'annual'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Metas Anuais ({annualGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'monthly'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Metas Mensais ({monthlyGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'weekly'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Metas Semanais ({weeklyGoals.length})
        </button>
      </div>

      {/* CASCADE TREE VIEW */}
      {activeTab === 'cascade' && (
        <div className="space-y-6">
          {annualGoals.map((annual) => {
            const epic = getEpic(annual.epicId);
            const childMonthlies = monthlyGoals.filter((m) => m.parentId === annual.id);
            const annualProg = annual.progress ?? 0;

            return (
              <div
                key={annual.id}
                className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4 hover:border-gray-500 transition-colors"
              >
                {/* Annual Goal Card Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#21262d]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Meta Anual • {annual.period}
                      </span>
                      {epic && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${epic.color}15`,
                            borderColor: `${epic.color}30`,
                            color: epic.color,
                          }}
                        >
                          {epic.title}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white">{annual.title}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-purple-400">
                        {annualProg}%
                      </span>
                      <span className="text-[10px] text-gray-400 block">Progresso consolidado</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModal('goal', annual)}
                        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#21262d]"
                        title="Editar meta anual"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(annual.id, annual.title)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-950/20"
                        title="Excluir meta anual"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Annual Progress Bar */}
                <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden border border-[#30363d]">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${annualProg}%` }}
                  ></div>
                </div>

                {/* Child Monthly Goals */}
                <div className="pl-4 sm:pl-8 border-l-2 border-purple-500/30 space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      ↳ Metas Mensais Derivadas ({childMonthlies.length})
                    </span>
                    <button
                      onClick={() => openModal('goal', { type: 'monthly', parentId: annual.id, epicId: annual.epicId })}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Meta Mensal
                    </button>
                  </div>

                  {childMonthlies.map((monthly) => {
                    const childWeeklies = weeklyGoals.filter((w) => w.parentId === monthly.id);
                    const monthlyProg = monthly.progress ?? 0;

                    return (
                      <div
                        key={monthly.id}
                        className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Mês • {monthly.period}
                            </span>
                            <h4 className="text-sm font-semibold text-gray-200">
                              {monthly.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-bold text-blue-400">
                              {monthlyProg}%
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openModal('goal', monthly)}
                                className="p-1 rounded text-gray-400 hover:text-white"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(monthly.id, monthly.title)}
                                className="p-1 rounded text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Monthly Progress Bar */}
                        <div className="w-full bg-[#161b22] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${monthlyProg}%` }}
                          ></div>
                        </div>

                        {/* Child Weekly Goals (Execution Sprints) */}
                        <div className="pl-4 border-l-2 border-blue-500/30 space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-gray-400">
                              ↳ Sprints Semanais ({childWeeklies.length})
                            </span>
                            <button
                              onClick={() => openModal('goal', { type: 'weekly', parentId: monthly.id, epicId: monthly.epicId })}
                              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Adicionar Meta Semanal
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {childWeeklies.map((weekly) => {
                              const linkedTasks = tasks.filter((t) => t.goalId === weekly.id);
                              const completedTasks = linkedTasks.filter((t) => t.status === 'concluido');
                              const weeklyProg = weekly.progress ?? 0;

                              return (
                                <div
                                  key={weekly.id}
                                  className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-col justify-between"
                                >
                                  <div className="flex items-start justify-between gap-1 mb-1.5">
                                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                      {weekly.period}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                      {weeklyProg}%
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-gray-200 mb-2">
                                    {weekly.title}
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#21262d]">
                                    <span>
                                      {completedTasks.length}/{linkedTasks.length} tarefas
                                    </span>
                                    <button
                                      onClick={() => openModal('task', { goalId: weekly.id, epicId: weekly.epicId })}
                                      className="text-blue-400 hover:underline"
                                    >
                                      + Tarefa
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {childMonthlies.length === 0 && (
                    <p className="text-xs text-gray-500 italic">
                      Nenhuma meta mensal vinculada a esta meta anual.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTERED TIER VIEWS */}
      {activeTab !== 'cascade' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(activeTab === 'annual'
            ? annualGoals
            : activeTab === 'monthly'
            ? monthlyGoals
            : weeklyGoals
          ).map((goal) => {
            const epic = getEpic(goal.epicId);
            const prog = goal.progress ?? 0;

            return (
              <div
                key={goal.id}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col justify-between hover:border-gray-500 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {goal.type} • {goal.period}
                    </span>
                    {epic && (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border truncate max-w-[130px]"
                        style={{
                          backgroundColor: `${epic.color}15`,
                          borderColor: `${epic.color}30`,
                          color: epic.color,
                        }}
                      >
                        {epic.title}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">{goal.title}</h3>
                </div>

                <div className="pt-3 border-t border-[#21262d] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progresso</span>
                    <span className="font-mono font-bold text-emerald-400">{prog}%</span>
                  </div>
                  <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${prog}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button
                      onClick={() => openModal('goal', goal)}
                      className="text-xs text-gray-400 hover:text-white p-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id, goal.title)}
                      className="text-xs text-red-400 hover:text-red-300 p-1"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
