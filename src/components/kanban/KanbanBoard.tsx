import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Database } from 'sql.js';
import { Todo, Contact } from '../../types';
import {
  getAllTodos,
  createTodo,
  updateTodoStatus,
  updateTodo,
  deleteTodo,
  setTodoProjects,
  setTodoContacts,
  getTodoProjects,
  getTodoContacts,
  getAllProjects,
  getAllContacts,
} from '../../db/database';
import { KanbanColumn } from './KanbanColumn';
import { TodoDialog } from './TodoDialog';
import { ProjectOverview } from './ProjectOverview';
import { DeleteConfirmDialog } from '../ui/DeleteConfirmDialog';

interface KanbanBoardProps {
  db: Database;
}

export function KanbanBoard({ db }: KanbanBoardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [todos, setTodos] = useState<Todo[]>(() => getAllTodos(db));
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allContacts = useMemo(() => getAllContacts(db), [db]);

  // Build a map of todoId -> Contact[] for rendering in cards
  const todoContactsMap = useMemo(() => {
    const map = new Map<string, Contact[]>();
    for (const todo of todos) {
      const contactIds = getTodoContacts(db, todo.id);
      if (contactIds.length > 0) {
        const contacts = allContacts.filter((c) => contactIds.includes(c.id));
        map.set(todo.id, contacts);
      }
    }
    return map;
  }, [db, todos, allContacts]);

  const refresh = useCallback(() => {
    setTodos(getAllTodos(db));
  }, [db]);

  useEffect(() => {
    const state = location.state as { editTodoId?: string } | null;
    if (state?.editTodoId) {
      const todo = todos.find((t) => t.id === state.editTodoId) ?? null;
      if (todo) {
        setEditingTodo(todo);
        setShowDialog(true);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, todos, navigate, location.pathname]);

  function handleCreate() {
    setEditingTodo(null);
    setShowDialog(true);
  }

  function handleEdit(todo: Todo) {
    setEditingTodo(todo);
    setShowDialog(true);
  }

  function handleSave(name: string, priority: Todo['priority'], projectIds: string[], contactIds: string[]) {
    if (editingTodo) {
      updateTodo(db, editingTodo.id, name, priority);
      setTodoProjects(db, editingTodo.id, projectIds);
      setTodoContacts(db, editingTodo.id, contactIds);
    } else {
      const newTodo = createTodo(db, name, priority);
      setTodoProjects(db, newTodo.id, projectIds);
      setTodoContacts(db, newTodo.id, contactIds);
    }
    setShowDialog(false);
    refresh();
  }

  function handleStatusChange(id: string, status: Todo['status']) {
    updateTodoStatus(db, id, status);
    refresh();
  }

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteTodo(db, deletingId);
    refresh();
    setDeletingId(null);
  }

  const open = todos.filter((t) => t.status === 'open');
  const inProgress = todos.filter((t) => t.status === 'in_progress');
  const done = todos.filter((t) => t.status === 'done');

  return (
    <div className="kanban-page view-enter">
      <div className="page-header">
        <h2>Board<span className="header-accent">Command Center</span></h2>
        <div className="board-actions">
          <button className="btn btn-primary" onClick={handleCreate}>+ Neues ToDo</button>
          <button className="btn" onClick={() => navigate('/notes', { state: { autoCreate: true } })}>+ Neue Notiz</button>
          <button className="btn" onClick={() => navigate('/projects', { state: { autoCreate: true } })}>+ Neues Projekt</button>
          <button className="btn" onClick={() => navigate('/contacts', { state: { autoCreate: true } })}>+ Neuer Kontakt</button>
        </div>
      </div>
      <div className="kanban-stats-bar">
        <div className="kanban-stat">
          <span className="kanban-stat-dot open" />
          <span className="kanban-stat-count">{open.length}</span>
          <span>Offen</span>
        </div>
        <div className="kanban-stat">
          <span className="kanban-stat-dot progress" />
          <span className="kanban-stat-count">{inProgress.length}</span>
          <span>In Arbeit</span>
        </div>
        <div className="kanban-stat">
          <span className="kanban-stat-dot done" />
          <span className="kanban-stat-count">{done.length}</span>
          <span>Erledigt</span>
        </div>
      </div>
      <ProjectOverview db={db} />
      <div className="kanban-board">
        <KanbanColumn
          title="Open"
          status="open"
          todos={open}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleCreate}
          accentClass="col-open"
          todoContacts={todoContactsMap}
        />
        <KanbanColumn
          title="In Progress"
          status="in_progress"
          todos={inProgress}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleCreate}
          accentClass="col-progress"
          todoContacts={todoContactsMap}
        />
        <KanbanColumn
          title="Done"
          status="done"
          todos={done}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleCreate}
          accentClass="col-done"
          todoContacts={todoContactsMap}
        />
      </div>
      {deletingId && (
        <DeleteConfirmDialog
          itemName={todos.find((t) => t.id === deletingId)?.name ?? 'ToDo'}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
      {showDialog && (
        <TodoDialog
          todo={editingTodo}
          projects={getAllProjects(db)}
          contacts={allContacts}
          initialProjects={editingTodo ? getTodoProjects(db, editingTodo.id) : []}
          initialContacts={editingTodo ? getTodoContacts(db, editingTodo.id) : []}
          onSave={handleSave}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
