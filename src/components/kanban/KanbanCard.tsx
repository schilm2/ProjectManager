import { Todo } from '../../types';

interface KanbanCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_LABELS: Record<Todo['priority'], string> = {
  critical: 'Kritisch',
  high: 'Hoch',
  normal: 'Normal',
  low: 'Niedrig',
};

export function KanbanCard({ todo, onEdit, onDelete }: KanbanCardProps) {
  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('todoId', todo.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Only open edit dialog on direct card clicks, not on button clicks
    if ((e.target as HTMLElement).closest('button')) return;
    onEdit(todo);
  }

  return (
    <div
      className={`kanban-card priority-${todo.priority}`}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
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
    </div>
  );
}
