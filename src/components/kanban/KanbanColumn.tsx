import { useState } from 'react';
import { Todo, Contact, Project } from '../../types';
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
  todoProjects: Map<string, Project[]>;
}

export function KanbanColumn({ title, status, todos, onStatusChange, onEdit, onDelete, onAdd, accentClass, todoContacts, todoProjects }: KanbanColumnProps) {
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
        {todos.length === 0 ? (
          <div className="kanban-empty-state">
            <p>Keine Aufgaben</p>
          </div>
        ) : (
          todos.map((todo) => (
            <KanbanCard
              key={todo.id}
              todo={todo}
              onEdit={onEdit}
              onDelete={onDelete}
              contacts={todoContacts.get(todo.id) ?? []}
              projects={todoProjects.get(todo.id) ?? []}
            />
          ))
        )}
        {onAdd && (
          <button
            className="kanban-add-circle-btn"
            onClick={onAdd}
            title="Aufgabe hinzufügen"
            aria-label="Aufgabe hinzufügen"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
