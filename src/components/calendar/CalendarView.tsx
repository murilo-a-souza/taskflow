import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { Task } from '../../types';

export const CalendarView: React.FC = () => {
  const { filteredTasks, openModal, epics } = useTaskFlow();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date('2026-11-02T12:00:00'));

  // Helpers
  const formatIsoDate = (d: Date) => d.toISOString().split('T')[0];

  // Generate Week Days (Monday to Sunday)
  const getWeekDays = (centerDate: Date) => {
    const dayOfWeek = centerDate.getDay(); // 0 is Sunday
    // Adjust to Monday as first day
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(centerDate);
    monday.setDate(centerDate.getDate() - distanceToMonday);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Generate Month Days (42 cells: 6 weeks)
  const getMonthDays = (centerDate: Date) => {
    const year = centerDate.getFullYear();
    const month = centerDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - distanceToMonday);

    const days: Date[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const monthDays = getMonthDays(currentDate);

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date('2026-11-02T12:00:00'));
  };

  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white capitalize">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-xs text-gray-400">
              Separação de Eventos Agendados ⏰ vs. Fluxo Diário 🎯
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] text-xs">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'week' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'month' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
            <button
              onClick={prevPeriod}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d]"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="text-xs px-2.5 py-1 text-gray-300 hover:text-white font-medium"
            >
              Hoje
            </button>
            <button
              onClick={nextPeriod}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#21262d]"
              title="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View: WEEKLY VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dateObj, idx) => {
            const dateStr = formatIsoDate(dateObj);
            const isToday = dateStr === '2026-11-02';
            const dayTasks = filteredTasks.filter((t) => t.date === dateStr);
            const events = dayTasks.filter((t) => !!t.time).sort((a, b) => (a.time! > b.time! ? 1 : -1));
            const flowTasks = dayTasks.filter((t) => !t.time);

            return (
              <div
                key={dateStr}
                className={`bg-[#161b22] border rounded-xl flex flex-col min-h-[460px] ${
                  isToday
                    ? 'border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : 'border-[#30363d]'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 border-b border-[#30363d] rounded-t-xl flex items-center justify-between ${
                    isToday ? 'bg-blue-950/30' : 'bg-[#0d1117]/50'
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block">
                      {dayNames[idx]}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        isToday ? 'text-blue-400' : 'text-gray-200'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <button
                    onClick={() => openModal('task', { date: dateStr })}
                    className="p-1 text-gray-500 hover:text-white hover:bg-[#21262d] rounded"
                    title={`Adicionar item em ${dateStr}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Body: Events first, then Flow Tasks */}
                <div className="p-2.5 flex-1 space-y-3 overflow-y-auto">
                  {/* Events Section */}
                  {events.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Eventos ({events.length})
                      </span>
                      {events.map((evt) => {
                        const epic = epics.find((e) => e.id === evt.epicId);
                        return (
                          <div
                            key={evt.id}
                            onClick={() => openModal('task', evt)}
                            className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 hover:border-amber-400/60 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1 rounded">
                                {evt.time}
                              </span>
                              <span className="text-[9px] uppercase font-bold text-amber-400/80">
                                30m alert
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-amber-100 line-clamp-2">
                              {evt.title}
                            </p>
                            {epic && (
                              <span className="text-[10px] text-amber-400/80 block mt-1">
                                {epic.title}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Flow Tasks Section */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Fluxo Diário ({flowTasks.length})
                    </span>
                    {flowTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openModal('task', t)}
                        className={`p-2 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-blue-500/50 cursor-pointer transition-all text-xs ${
                          t.status === 'concluido' ? 'opacity-60 line-through' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-mono text-gray-500 font-medium">
                            {t.id}
                          </span>
                          <span className="text-[9px] uppercase font-bold px-1 rounded bg-gray-800 text-gray-300">
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-200 line-clamp-2">{t.title}</p>
                      </div>
                    ))}

                    {dayTasks.length === 0 && (
                      <div className="py-8 text-center text-gray-600 text-[11px] italic">
                        Sem itens
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View: MONTHLY VIEW */}
      {viewMode === 'month' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#30363d] bg-[#0d1117] text-center text-xs font-semibold text-gray-400 py-2.5">
            {dayNames.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#30363d]">
            {monthDays.map((d) => {
              const dateStr = formatIsoDate(d);
              const isCurrentMonth = d.getMonth() === currentDate.getMonth();
              const isToday = dateStr === '2026-11-02';
              const dayTasks = filteredTasks.filter((t) => t.date === dateStr);
              const events = dayTasks.filter((t) => !!t.time);

              return (
                <div
                  key={dateStr}
                  onClick={() => openModal('task', { date: dateStr })}
                  className={`min-h-[110px] p-2 flex flex-col transition-colors cursor-pointer hover:bg-[#21262d]/50 ${
                    !isCurrentMonth ? 'opacity-35 bg-[#0d1117]/40' : ''
                  } ${isToday ? 'bg-blue-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday ? 'bg-blue-500 text-white' : 'text-gray-300'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono text-gray-500">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {events.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('task', evt);
                        }}
                        className="truncate text-[10px] font-medium bg-amber-950/50 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded"
                        title={`${evt.time} - ${evt.title}`}
                      >
                        ⏰ {evt.time} {evt.title}
                      </div>
                    ))}

                    {dayTasks
                      .filter((t) => !t.time)
                      .slice(0, 2)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('task', t);
                          }}
                          className={`truncate text-[10px] bg-[#0d1117] text-gray-300 border border-[#30363d] px-1.5 py-0.5 rounded ${
                            t.status === 'concluido' ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          ● {t.title}
                        </div>
                      ))}

                    {dayTasks.filter((t) => !t.time).length > 2 && (
                      <span className="text-[9px] text-gray-500 pl-1">
                        +{dayTasks.filter((t) => !t.time).length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
