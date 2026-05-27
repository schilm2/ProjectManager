import { useState } from 'react';
import { Todo, Contact } from '../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  status: Todo['status'];
  todos: Todo[];
  onStatusChange: (id: string, status: Todo['status']) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
  accentClass: string;
  todoContacts: Map<string, Contact[]>;
}

export function KanbanColumn({ title, status, todos, onStatusChange, onEdit, onDelete, onAdd, accentClass, todoContacts }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const todoId = e.dataTransfer.getData('todoId');
    if (todoId) {
      onStatusChange(todoId, status);
    }
  }

  return (
    <div className={`kanban-column ${accentClass}`}>
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span className="badge">{todos.length}</span>
      </div>
      <div
        className={`kanban-column-body${isDragOver ? ' drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {todos.map((todo) => (
          <KanbanCard
            key={todo.id}
            todo={todo}
            onEdit={onEdit}
            onDelete={onDelete}
            contacts={todoContacts.get(todo.id) ?? []}
          />
        ))}
        {onAdd && (
          <div className="kanban-add-placeholder" onClick={onAdd} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}>
            + Aufgabe hinzufuegen
          </div>
        )}
      </div>
    </div>
  );
}
