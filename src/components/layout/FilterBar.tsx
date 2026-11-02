import React from 'react';
import { Filter, Clock, Zap, X, ChevronDown } from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';

export const FilterBar: React.FC = () => {
  const {
    epics,
    goals,
    tags,
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
    tasks,
  } = useTaskFlow();

  const hasActiveFilters =
    selectedEpicFilter !== 'all' ||
    selectedGoalFilter !== 'all' ||
    selectedPriorityFilter !== 'all' ||
    selectedTagFilter !== 'all' ||
    selectedTypeFilter !== 'all';

  const clearAllFilters = () => {
    setSelectedEpicFilter('all');
    setSelectedGoalFilter('all');
    setSelectedPriorityFilter('all');
    setSelectedTagFilter('all');
    setSelectedTypeFilter('all');
  };

  return (
    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Concept Switcher (Events vs Flow Tasks) */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTypeFilter === 'all'
                ? 'bg-[#21262d] text-white shadow-xs'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('flow')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTypeFilter === 'flow'
                ? 'bg-blue-950/70 text-blue-300 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Tarefas de fluxo de trabalho diário sem compromisso de horário fixo (Bullet Journal)"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Fluxo Contínuo ({tasks.filter((t) => !t.time).length})</span>
          </button>
          <button
            onClick={() => setSelectedTypeFilter('events')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTypeFilter === 'events'
                ? 'bg-amber-950/70 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Itens com horário marcado são tratados como eventos com lembretes prévios"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Eventos ({tasks.filter((t) => !!t.time).length})</span>
          </button>
        </div>

        {/* Right: Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Epic Filter */}
          <div className="relative">
            <select
              value={selectedEpicFilter}
              onChange={(e) => setSelectedEpicFilter(e.target.value)}
              className="tf-input py-1 text-xs appearance-none pr-7 bg-[#0d1117]"
            >
              <option value="all">Área / Épico: Todos</option>
              {epics.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Goal Filter */}
          <div className="relative">
            <select
              value={selectedGoalFilter}
              onChange={(e) => setSelectedGoalFilter(e.target.value)}
              className="tf-input py-1 text-xs appearance-none pr-7 bg-[#0d1117] max-w-[170px] truncate"
            >
              <option value="all">Meta: Todas</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.type.slice(0, 3).toUpperCase()}] {g.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="tf-input py-1 text-xs appearance-none pr-7 bg-[#0d1117]"
            >
              <option value="all">Prioridade: Todas</option>
              <option value="urgente">🔴 Urgente</option>
              <option value="alta">🟠 Alta</option>
              <option value="media">🟡 Média</option>
              <option value="baixa">🔵 Baixa</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Tag Filter */}
          <div className="relative">
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="tf-input py-1 text-xs appearance-none pr-7 bg-[#0d1117]"
            >
              <option value="all">Tag: Todas</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/30 border border-red-500/20 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          )}

          {/* Counter Badge */}
          <span className="text-[11px] text-gray-400 font-mono pl-1">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>
    </div>
  );
};
