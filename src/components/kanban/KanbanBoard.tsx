import React from 'react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { KanbanColumn } from './KanbanColumn';
import { TaskStatus } from '../../types';

export const KanbanBoard: React.FC = () => {
  const { filteredTasks, moveTaskStatus } = useTaskFlow();

  const columns: { status: TaskStatus; title: string }[] = [
    { status: 'planejando', title: 'Planejando' },
    { status: 'fazendo', title: 'Fazendo' },
    { status: 'revisando', title: 'Revisando' },
    { status: 'concluido', title: 'Concluído' },
    { status: 'bloqueado', title: 'Bloqueado' },
  ];

  const handleDropTask = (taskId: string, targetStatus: TaskStatus) => {
    moveTaskStatus(taskId, targetStatus);
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6">
      <div className="flex gap-4 min-w-[1450px] pb-4 items-start">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            tasks={filteredTasks.filter((t) => t.status === col.status)}
            onDropTask={handleDropTask}
          />
        ))}
      </div>
    </div>
  );
};
