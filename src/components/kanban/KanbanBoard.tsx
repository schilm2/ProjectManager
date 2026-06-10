import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Database } from 'sql.js';
import { Todo, Contact, Project } from '../../types';
import { useToast } from '../../context/ToastContext';
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
  createProject,
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
  const { addToast } = useToast();
  const [todos, setTodos] = useState<Todo[]>(() => getAllTodos(db));
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allContacts = useMemo(() => getAllContacts(db), [db]);
  const allProjects = useMemo(() => getAllProjects(db), [db]);

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

  // Build a map of todoId -> Project[] for rendering in cards
  const todoProjectsMap = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const todo of todos) {
      const projectIds = getTodoProjects(db, todo.id);
      if (projectIds.length > 0) {
        const projects = allProjects.filter((p) => projectIds.includes(p.id));
        map.set(todo.id, projects);
      }
    }
    return map;
  }, [db, todos, allProjects]);

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

  function handleCreateProject(name: string) {
    const project = createProject(db, name, '');
    refresh();
    return project;
  }

  function handleCreate() {
    setEditingTodo(null);
    setShowDialog(true);
  }

  function handleEdit(todo: Todo) {
    setEditingTodo(todo);
    setShowDialog(true);
  }

  function handleSave(name: string, priority: Todo['priority'], projectIds: string[], contactIds: string[], description: string) {
    try {
      if (editingTodo) {
        updateTodo(db, editingTodo.id, name, priority, description);
        setTodoProjects(db, editingTodo.id, projectIds);
        setTodoContacts(db, editingTodo.id, contactIds);
        addToast('ToDo aktualisiert', 'success');
      } else {
        const newTodo = createTodo(db, name, priority);
        setTodoProjects(db, newTodo.id, projectIds);
        setTodoContacts(db, newTodo.id, contactIds);
        addToast('ToDo erstellt', 'success');
      }
      setShowDialog(false);
      refresh();
    } catch (error) {
      addToast('Fehler beim Speichern des ToDos', 'error');
    }
  }

  function handleStatusChange(id: string, status: Todo['status']) {
    try {
      updateTodoStatus(db, id, status);
      const statusLabel = { 'open': 'Offen', 'in_progress': 'In Arbeit', 'done': 'Erledigt' }[status];
      addToast(`Status zu ${statusLabel} geändert`, 'success');
      refresh();
    } catch (error) {
      addToast('Fehler beim Ändern des Status', 'error');
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    try {
      deleteTodo(db, deletingId);
      addToast('ToDo gelöscht', 'success');
      refresh();
      setDeletingId(null);
    } catch (error) {
      addToast('Fehler beim Löschen des ToDos', 'error');
    }
  }

  const PRIORITY_ORDER: Record<Todo['priority'], number> = { critical: 0, high: 1, normal: 2, low: 3 };
  const byPriority = (a: Todo, b: Todo) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

  const open = todos.filter((t) => t.status === 'open').sort(byPriority);
  const inProgress = todos.filter((t) => t.status === 'in_progress').sort(byPriority);
  const done = todos.filter((t) => t.status === 'done').sort(byPriority);

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
          todoProjects={todoProjectsMap}
        />
        <KanbanColumn
          title="In Progress"
          status="in_progress"
          todos={inProgress}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          accentClass="col-progress"
          todoContacts={todoContactsMap}
          todoProjects={todoProjectsMap}
        />
        <KanbanColumn
          title="Done"
          status="done"
          todos={done}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          accentClass="col-done"
          todoContacts={todoContactsMap}
          todoProjects={todoProjectsMap}
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
          onCreateProject={handleCreateProject}
        />
      )}
    </div>
  );
}
