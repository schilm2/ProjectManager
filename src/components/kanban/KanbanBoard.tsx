import { useState, useCallback } from 'react';
import { Database } from 'sql.js';
import { Todo } from '../../types';
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

interface KanbanBoardProps {
  db: Database;
}

export function KanbanBoard({ db }: KanbanBoardProps) {
  const [todos, setTodos] = useState<Todo[]>(() => getAllTodos(db));
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const refresh = useCallback(() => {
    setTodos(getAllTodos(db));
  }, [db]);

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
    deleteTodo(db, id);
    refresh();
  }

  const open = todos.filter((t) => t.status === 'open');
  const inProgress = todos.filter((t) => t.status === 'in_progress');
  const done = todos.filter((t) => t.status === 'done');

  return (
    <div className="kanban-page">
      <div className="page-header">
        <h2>Board</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Neues ToDo
        </button>
      </div>
      <div className="kanban-board">
        <KanbanColumn
          title="Open"
          todos={open}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          accentClass="col-open"
        />
        <KanbanColumn
          title="In Progress"
          todos={inProgress}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          accentClass="col-progress"
        />
        <KanbanColumn
          title="Done"
          todos={done}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          accentClass="col-done"
        />
      </div>
      {showDialog && (
        <TodoDialog
          todo={editingTodo}
          projects={getAllProjects(db)}
          contacts={getAllContacts(db)}
          initialProjects={editingTodo ? getTodoProjects(db, editingTodo.id) : []}
          initialContacts={editingTodo ? getTodoContacts(db, editingTodo.id) : []}
          onSave={handleSave}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
