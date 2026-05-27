import { Todo, Contact } from '../../types';

interface KanbanCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  contacts?: Contact[];
}

const PRIORITY_LABELS: Record<Todo['priority'], string> = {
  critical: 'Kritisch',
  high: 'Hoch',
  normal: 'Normal',
  low: 'Niedrig',
};

const AVATAR_VARIANTS = ['a', 'b', 'c', 'd', 'e', 'f'];

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'heute';
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays}d`;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export function KanbanCard({ todo, onEdit, onDelete, contacts = [] }: KanbanCardProps) {
  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('todoId', todo.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return;
    onEdit(todo);
  }

  return (
    <div
      className={`kanban-card card-enter priority-${todo.priority}`}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
      <div className="kanban-card-header">
        <div className="kanban-card-actions">
          <button className="btn-icon" onClick={() => onEdit(todo)} title="Bearbeiten">&#9998;</button>
          <button className="btn-icon btn-danger" onClick={() => onDelete(todo.id)} title="Loeschen">&times;</button>
        </div>
      </div>
      <div className="kanban-card-title-row">
        <p className="kanban-card-title">{todo.name}</p>
        <span className={`priority-badge priority-${todo.priority}`}>
          {PRIORITY_LABELS[todo.priority]}
        </span>
      </div>
      <div className="kanban-card-meta">
        {contacts.slice(0, 2).map((c) => {
          const initial = c.name.charAt(0).toUpperCase();
          const avatarClass = AVATAR_VARIANTS[initial.charCodeAt(0) % AVATAR_VARIANTS.length];
          return (
            <span
              key={c.id}
              className={`kanban-card-assignee contact-avatar-${avatarClass}`}
              title={c.name}
            >
              {initial}
            </span>
          );
        })}
        <span className="kanban-card-date">{formatRelativeDate(todo.createdAt)}</span>
      </div>
    </div>
  );
}
