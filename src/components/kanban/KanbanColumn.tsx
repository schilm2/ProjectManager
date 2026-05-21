import { Todo } from '../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  todos: Todo[];
  onStatusChange: (id: string, status: Todo['status']) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  accentClass: string;
}

export function KanbanColumn({ title, todos, onStatusChange, onEdit, onDelete, accentClass }: KanbanColumnProps) {
  return (
    <div className={`kanban-column ${accentClass}`}>
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span className="badge">{todos.length}</span>
      </div>
      <div className="kanban-column-body">
        {todos.map((todo) => (
          <KanbanCard
            key={todo.id}
            todo={todo}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
