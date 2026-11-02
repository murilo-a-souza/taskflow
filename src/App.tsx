/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { ListView } from './components/list/ListView';
import { CalendarView } from './components/calendar/CalendarView';
import { GoalsView } from './components/goals/GoalsView';
import { EpicsView } from './components/epics/EpicsView';
import { TerminalDrawer } from './components/terminal/TerminalDrawer';
import { TaskModal } from './components/modals/TaskModal';
import { GoalModal } from './components/modals/GoalModal';
import { EpicModal } from './components/modals/EpicModal';
import { EmailModal } from './components/notifications/EmailModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeView, modalState, isCliOpen } = useTaskFlow();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400 font-mono">Carregando TaskFlow...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const showFilterBar = ['kanban', 'list', 'calendar'].includes(activeView);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col selection:bg-blue-600/30 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Contextual Filter Bar */}
      {showFilterBar && <FilterBar />}

      {/* Main View Area */}
      <main
        className={`flex-1 transition-all pb-16 ${
          isCliOpen ? 'mb-[360px]' : 'mb-9'
        }`}
      >
        {activeView === 'kanban' && <KanbanBoard />}
        {activeView === 'list' && <ListView />}
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'goals' && <GoalsView />}
        {activeView === 'epics' && <EpicsView />}
      </main>

      {/* Docked VS Code-style Terminal Drawer */}
      <TerminalDrawer />

      {/* Active Modals */}
      {modalState.isOpen && modalState.type === 'task' && <TaskModal />}
      {modalState.isOpen && modalState.type === 'goal' && <GoalModal />}
      {modalState.isOpen && modalState.type === 'epic' && <EpicModal />}
      {modalState.isOpen &&
        (modalState.type === 'email_settings' || modalState.type === 'email_preview') && (
          <EmailModal />
        )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TaskFlowProvider>
        <AppContent />
      </TaskFlowProvider>
    </AuthProvider>
  );
}
