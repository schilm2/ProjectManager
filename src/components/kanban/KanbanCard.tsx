import { Todo } from '../../types';

interface KanbanCardProps {
  todo: Todo;
  onStatusChange: (id: string, status: Todo['status']) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_LABELS: Record<Todo['priority'], string> = {
  critical: 'Kritisch',
  high: 'Hoch',
  normal: 'Normal',
  low: 'Niedrig',
};

export function KanbanCard({ todo, onStatusChange, onEdit, onDelete }: KanbanCardProps) {
  return (
    <div className={`kanban-card priority-${todo.priority}`}>
      <div className="kanban-card-header">
        <span className={`priority-badge priority-${todo.priority}`}>
          {PRIORITY_LABELS[todo.priority]}
        </span>
        <div className="kanban-card-actions">
          <button className="btn-icon" onClick={() => onEdit(todo)} title="Bearbeiten">&#9998;</button>
          <button className="btn-icon btn-danger" onClick={() => onDelete(todo.id)} title="Löschen">&times;</button>
        </div>
      </div>
      <p className="kanban-card-title">{todo.name}</p>
      <div className="kanban-card-footer">
        {todo.status !== 'open' && (
          <button className="btn btn-xs" onClick={() => onStatusChange(todo.id, 'open')}>
            &larr; Open
          </button>
        )}
        {todo.status !== 'in_progress' && (
          <button className="btn btn-xs" onClick={() => onStatusChange(todo.id, 'in_progress')}>
            In Progress
          </button>
        )}
        {todo.status !== 'done' && (
          <button className="btn btn-xs" onClick={() => onStatusChange(todo.id, 'done')}>
            Done &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
