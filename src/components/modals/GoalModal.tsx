import React, { useState } from 'react';
import { X, Target, Layers, Sparkles, Trash2 } from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { Goal, GoalType } from '../../types';

export const GoalModal: React.FC = () => {
  const { modalState, closeModal, createGoal, updateGoal, deleteGoal, goals, epics } = useTaskFlow();

  const isEditing = Boolean(modalState.data?.id);
  const initialGoal: Partial<Goal> = modalState.data || {};

  const [title, setTitle] = useState(initialGoal.title || '');
  const [description, setDescription] = useState(initialGoal.description || '');
  const [type, setType] = useState<GoalType>(initialGoal.type || 'weekly');
  const [parentId, setParentId] = useState(initialGoal.parentId || '');
  const [epicId, setEpicId] = useState(initialGoal.epicId || '');
  const [period, setPeriod] = useState(
    initialGoal.period ||
      (type === 'annual' ? '2026' : type === 'monthly' ? '2026-11' : '2026-W45')
  );
  const [targetValue, setTargetValue] = useState<number | undefined>(initialGoal.targetValue);
  const [currentValue, setCurrentValue] = useState<number | undefined>(initialGoal.currentValue);
  const [unit, setUnit] = useState(initialGoal.unit || '%');

  // Potential Parent Goals:
  // If Weekly, parent can be a Monthly Goal
  // If Monthly, parent can be an Annual Goal
  const candidateParents =
    type === 'weekly'
      ? goals.filter((g) => g.type === 'monthly')
      : type === 'monthly'
      ? goals.filter((g) => g.type === 'annual')
      : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      parentId: parentId || undefined,
      epicId: epicId || undefined,
      period: period.trim(),
      targetValue: targetValue ? Number(targetValue) : undefined,
      currentValue: currentValue ? Number(currentValue) : undefined,
      unit: unit || undefined,
      status: initialGoal.status || 'active',
    };

    if (isEditing && initialGoal.id) {
      updateGoal(initialGoal.id, payload);
    } else {
      createGoal(payload);
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Editar Meta' : 'Nova Meta Estratégica'}
            </h2>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Goal Type Tier */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Nível da Meta na Cascata
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('annual');
                  setPeriod('2026');
                }}
                className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                  type === 'annual'
                    ? 'bg-purple-950/50 text-purple-300 border-purple-500'
                    : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                }`}
              >
                Meta Anual
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('monthly');
                  setPeriod('2026-11');
                }}
                className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                  type === 'monthly'
                    ? 'bg-blue-950/50 text-blue-300 border-blue-500'
                    : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                }`}
              >
                Meta Mensal
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('weekly');
                  setPeriod('2026-W45');
                }}
                className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                  type === 'weekly'
                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500'
                    : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                }`}
              >
                Meta Semanal
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Título da Meta <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aportar R$ 60.000, Lançar versão 1.0, Correr 1000km..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="tf-input w-full py-2 text-sm"
              autoFocus
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Período de Referência
            </label>
            <input
              type="text"
              placeholder="Ex: 2026, 2026-11, 2026-W45"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="tf-input w-full font-mono py-1.5"
            />
          </div>

          {/* Parent Goal link (Cascading connection) */}
          {candidateParents.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Meta Pai de Referência (Cascata)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="tf-input w-full py-2"
              >
                <option value="">Nenhuma (Independente)</option>
                {candidateParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.period}] {p.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                O progresso desta meta impactará automaticamente a meta pai.
              </p>
            </div>
          )}

          {/* Epic / Life Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Área Fundamental / Épico
            </label>
            <select
              value={epicId}
              onChange={(e) => setEpicId(e.target.value)}
              className="tf-input w-full py-2"
            >
              <option value="">Geral / Sem Área</option>
              {epics.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* Numeric Target (Optional) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Alvo</label>
              <input
                type="number"
                placeholder="100"
                value={targetValue || ''}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="tf-input w-full py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Atual</label>
              <input
                type="number"
                placeholder="0"
                value={currentValue || ''}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="tf-input w-full py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Unidade</label>
              <input
                type="text"
                placeholder="%, km, R$, livros"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="tf-input w-full py-1.5"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#30363d] flex items-center justify-between">
            {isEditing ? (
              <button
                type="button"
                onClick={() => {
                  if (initialGoal.id && window.confirm(`Excluir meta "${title}"?`)) {
                    deleteGoal(initialGoal.id);
                    closeModal();
                  }
                }}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button type="button" onClick={closeModal} className="tf-btn-secondary text-xs">
                Cancelar
              </button>
              <button type="submit" className="tf-btn-primary text-xs font-semibold px-4">
                {isEditing ? 'Salvar Alterações' : 'Criar Meta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
