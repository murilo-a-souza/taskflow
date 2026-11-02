import React from 'react';
import {
  Kanban,
  ListTodo,
  Calendar,
  Target,
  Layers,
  Plus,
  Terminal,
  Mail,
  Search,
  Sparkles,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveView } from '../../types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    openModal,
    toggleCli,
    isCliOpen,
    emailLogs,
    resetAllData,
  } = useTaskFlow();

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'kanban', label: 'Kanban', icon: <Kanban className="w-4 h-4" /> },
    { id: 'list', label: 'Lista & BuJo', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendário & Eventos', icon: <Calendar className="w-4 h-4" /> },
    { id: 'goals', label: 'Metas Cascata', icon: <Target className="w-4 h-4" /> },
    { id: 'epics', label: 'Áreas & Épicos', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-[#30363d] bg-[#161b22] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">TaskFlow</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  Agile & BuJo
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tarefas, IDs (#TF-101) ou descrições..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tf-input w-full pl-9 pr-4 py-1.5 text-xs bg-[#0d1117]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* New Task Button */}
            <button
              onClick={() => openModal('task')}
              className="tf-btn-primary text-xs font-semibold px-3 py-1.5 shadow-sm"
              title="Criar nova tarefa ou evento"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>

            {/* Email Center Button */}
            <button
              onClick={() => openModal('email_settings')}
              className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#21262d] border border-[#30363d] transition-colors"
              title="Central de Notificações por E-mail (Relatório Diário & Alertas)"
            >
              <Mail className="w-4 h-4" />
              {emailLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {emailLogs.length}
                </span>
              )}
            </button>

            {/* CLI Terminal Toggle */}
            <button
              onClick={toggleCli}
              className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                isCliOpen
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                  : 'bg-[#0d1117] text-gray-300 hover:text-white border-[#30363d] hover:border-gray-500'
              }`}
              title="Abrir Terminal CLI integrado (Ctrl + ~)"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">CLI</span>
              <kbd className="hidden lg:inline bg-[#21262d] text-gray-400 text-[10px] px-1 rounded border border-[#30363d]">
                ~
              </kbd>
            </button>

            {/* Reset Demo Data */}
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar os dados de exemplo do TaskFlow?')) {
                  resetAllData();
                }
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#21262d] transition-colors"
              title="Restaurar dados de exemplo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center pl-2 ml-1 border-l border-[#30363d] gap-2">
                <div
                  className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm"
                  title={`${user.name} (${user.email})`}
                >
                  {user.name.charAt(0)}
                </div>
                <span className="hidden xl:inline text-xs font-medium text-gray-300 max-w-[120px] truncate" title={user.name}>
                  {user.name}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Deseja realmente sair da sua conta?')) {
                      logout();
                    }
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#21262d] transition-colors"
                  title="Sair da conta (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex space-x-1 border-t border-[#21262d] pt-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-md transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-blue-500 text-white bg-[#0d1117]/60'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#21262d]/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
