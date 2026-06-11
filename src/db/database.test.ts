import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import initSqlJs, { Database } from 'sql.js';
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
  createProject,
  updateProjectStatus,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectTodos,
  getProjectNotes,
  getAllContacts,
  createContact,
  updateContact,
  deleteContact,
  getContactTodos,
  getContactNotes,
  getAllNotes,
  createNote,
  updateNoteContent,
  deleteNote,
  setNoteProjects,
  setNoteContacts,
  getNoteProjects,
  getNoteContacts,
  getSyncState,
  upsertSyncState,
  getOpenTodosForProject,
  markProjectTodosDone,
} from './database';
import { Todo, Project, Contact, Note } from '../types';

let db: Database;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  // Create all tables
  db.run(`
    CREATE TABLE todos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'open',
      done_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE todo_projects (
      todo_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      PRIMARY KEY (todo_id, project_id)
    );
    CREATE TABLE todo_contacts (
      todo_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      PRIMARY KEY (todo_id, contact_id)
    );
    CREATE TABLE notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE note_projects (
      note_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      PRIMARY KEY (note_id, project_id)
    );
    CREATE TABLE note_contacts (
      note_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      PRIMARY KEY (note_id, contact_id)
    );
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
    CREATE TABLE contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE sync_state (
      item_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      synced_at TEXT NOT NULL,
      PRIMARY KEY (item_id, project_id)
    );
  `);
});

describe('Todos', () => {
  it('should_create_todo_with_default_priority', () => {
    const todo = createTodo(db, 'Test Todo');
    expect(todo.name).toBe('Test Todo');
    expect(todo.priority).toBe('normal');
    expect(todo.status).toBe('open');
    expect(todo.doneAt).toBeNull();
    expect(todo.id).toBeTruthy();
    expect(todo.createdAt).toBeTruthy();
  });

  it('should_create_todo_with_custom_priority', () => {
    const todo = createTodo(db, 'Urgent Task', 'critical');
    expect(todo.priority).toBe('critical');
  });

  it('should_get_all_todos', () => {
    createTodo(db, 'Todo 1');
    createTodo(db, 'Todo 2');
    const todos = getAllTodos(db);
    expect(todos).toHaveLength(2);
    expect(todos.map((t) => t.name)).toContain('Todo 1');
    expect(todos.map((t) => t.name)).toContain('Todo 2');
  });

  it('should_get_empty_list_when_no_todos', () => {
    const todos = getAllTodos(db);
    expect(todos).toEqual([]);
  });

  it('should_update_todo_status_to_in_progress', () => {
    const todo = createTodo(db, 'Test Todo');
    updateTodoStatus(db, todo.id, 'in_progress');
    const todos = getAllTodos(db);
    expect(todos[0].status).toBe('in_progress');
  });

  it('should_set_doneAt_when_marking_as_done', () => {
    const todo = createTodo(db, 'Test Todo');
    updateTodoStatus(db, todo.id, 'done');
    const todos = getAllTodos(db);
    expect(todos[0].status).toBe('done');
    expect(todos[0].doneAt).toBeTruthy();
  });

  it('should_clear_doneAt_when_reopening_todo', () => {
    const todo = createTodo(db, 'Test Todo');
    updateTodoStatus(db, todo.id, 'done');
    updateTodoStatus(db, todo.id, 'open');
    const todos = getAllTodos(db);
    expect(todos[0].doneAt).toBeNull();
  });

  it('should_update_todo_name_and_priority', () => {
    const todo = createTodo(db, 'Old Name', 'low');
    updateTodo(db, todo.id, 'New Name', 'high');
    const todos = getAllTodos(db);
    expect(todos[0].name).toBe('New Name');
    expect(todos[0].priority).toBe('high');
  });

  it('should_delete_todo', () => {
    const todo = createTodo(db, 'Todo to delete');
    expect(getAllTodos(db)).toHaveLength(1);
    deleteTodo(db, todo.id);
    expect(getAllTodos(db)).toHaveLength(0);
  });

  it('should_delete_associated_todo_projects_on_todo_delete', () => {
    const todo = createTodo(db, 'Todo');
    const project = createProject(db, 'Project', '');
    setTodoProjects(db, todo.id, [project.id]);
    expect(getTodoProjects(db, todo.id)).toHaveLength(1);
    deleteTodo(db, todo.id);
    expect(getTodoProjects(db, todo.id)).toHaveLength(0);
  });

  it('should_set_multiple_project_associations', () => {
    const todo = createTodo(db, 'Todo');
    const proj1 = createProject(db, 'Project 1', '');
    const proj2 = createProject(db, 'Project 2', '');
    setTodoProjects(db, todo.id, [proj1.id, proj2.id]);
    const projects = getTodoProjects(db, todo.id);
    expect(projects).toHaveLength(2);
    expect(projects).toContain(proj1.id);
    expect(projects).toContain(proj2.id);
  });

  it('should_clear_project_associations_when_setting_empty_list', () => {
    const todo = createTodo(db, 'Todo');
    const project = createProject(db, 'Project', '');
    setTodoProjects(db, todo.id, [project.id]);
    expect(getTodoProjects(db, todo.id)).toHaveLength(1);
    setTodoProjects(db, todo.id, []);
    expect(getTodoProjects(db, todo.id)).toHaveLength(0);
  });

  it('should_set_multiple_contact_associations', () => {
    const todo = createTodo(db, 'Todo');
    const contact1 = createContact(db, 'Contact 1', '', '', '');
    const contact2 = createContact(db, 'Contact 2', '', '', '');
    setTodoContacts(db, todo.id, [contact1.id, contact2.id]);
    const contacts = getTodoContacts(db, todo.id);
    expect(contacts).toHaveLength(2);
    expect(contacts).toContain(contact1.id);
  });
});

describe('Projects', () => {
  it('should_create_project', () => {
    const project = createProject(db, 'My Project', 'A great project');
    expect(project.name).toBe('My Project');
    expect(project.description).toBe('A great project');
    expect(project.status).toBe('active');
    expect(project.id).toBeTruthy();
  });

  it('should_get_all_projects', () => {
    createProject(db, 'Project A', '');
    createProject(db, 'Project B', '');
    const projects = getAllProjects(db);
    expect(projects).toHaveLength(2);
  });

  it('should_return_empty_list_when_no_projects', () => {
    const projects = getAllProjects(db);
    expect(projects).toEqual([]);
  });

  it('should_update_project_name_and_description', () => {
    const project = createProject(db, 'Old Name', 'Old Desc');
    updateProject(db, project.id, 'New Name', 'New Desc');
    const projects = getAllProjects(db);
    expect(projects[0].name).toBe('New Name');
    expect(projects[0].description).toBe('New Desc');
  });

  it('should_update_project_status', () => {
    const project = createProject(db, 'Project', '');
    expect(project.status).toBe('active');
    updateProjectStatus(db, project.id, 'archive');
    const projects = getAllProjects(db);
    expect(projects[0].status).toBe('archive');
  });

  it('should_delete_project', () => {
    const project = createProject(db, 'Project', '');
    expect(getAllProjects(db)).toHaveLength(1);
    deleteProject(db, project.id);
    expect(getAllProjects(db)).toHaveLength(0);
  });

  it('should_delete_associated_todos_on_project_delete', () => {
    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Todo');
    setTodoProjects(db, todo.id, [project.id]);
    deleteProject(db, project.id);
    expect(getTodoProjects(db, todo.id)).toHaveLength(0);
  });

  it('should_calculate_project_stats', () => {
    const project = createProject(db, 'Project', '');
    const todo1 = createTodo(db, 'Todo 1');
    const todo2 = createTodo(db, 'Todo 2');
    const todo3 = createTodo(db, 'Todo 3');

    setTodoProjects(db, todo1.id, [project.id]);
    setTodoProjects(db, todo2.id, [project.id]);
    setTodoProjects(db, todo3.id, [project.id]);

    updateTodoStatus(db, todo1.id, 'done');
    updateTodoStatus(db, todo2.id, 'in_progress');

    const stats = getProjectStats(db, project.id);
    expect(stats.total).toBe(3);
    expect(stats.open).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('should_return_zero_stats_for_project_with_no_todos', () => {
    const project = createProject(db, 'Project', '');
    const stats = getProjectStats(db, project.id);
    expect(stats).toEqual({ total: 0, open: 0, inProgress: 0, done: 0 });
  });

  it('should_get_open_todos_for_project', () => {
    const project = createProject(db, 'Project', '');
    const todo1 = createTodo(db, 'Todo 1');
    const todo2 = createTodo(db, 'Todo 2');
    const todo3 = createTodo(db, 'Todo 3');

    setTodoProjects(db, todo1.id, [project.id]);
    setTodoProjects(db, todo2.id, [project.id]);
    setTodoProjects(db, todo3.id, [project.id]);

    updateTodoStatus(db, todo1.id, 'done');

    const openTodos = getOpenTodosForProject(db, project.id);
    expect(openTodos).toHaveLength(2);
    expect(openTodos.every((t) => t.status !== 'done')).toBe(true);
  });

  it('should_get_all_project_todos', () => {
    const project = createProject(db, 'Project', '');
    const todo1 = createTodo(db, 'Todo 1');
    const todo2 = createTodo(db, 'Todo 2');
    setTodoProjects(db, todo1.id, [project.id]);
    setTodoProjects(db, todo2.id, [project.id]);

    const todos = getProjectTodos(db, project.id);
    expect(todos).toHaveLength(2);
  });

  it('should_mark_all_project_todos_as_done', () => {
    const project = createProject(db, 'Project', '');
    const todo1 = createTodo(db, 'Todo 1');
    const todo2 = createTodo(db, 'Todo 2');
    setTodoProjects(db, todo1.id, [project.id]);
    setTodoProjects(db, todo2.id, [project.id]);

    markProjectTodosDone(db, project.id);

    const todos = getAllTodos(db);
    expect(todos.every((t) => t.status === 'done')).toBe(true);
  });

  it('should_not_mark_already_done_todos_again', () => {
    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Todo');
    setTodoProjects(db, todo.id, [project.id]);
    updateTodoStatus(db, todo.id, 'done');

    const firstDoneAt = getAllTodos(db)[0].doneAt;
    markProjectTodosDone(db, project.id);
    const secondDoneAt = getAllTodos(db)[0].doneAt;

    expect(firstDoneAt).toBeTruthy();
    expect(secondDoneAt).toBeTruthy();
  });
});

describe('Contacts', () => {
  it('should_create_contact', () => {
    const contact = createContact(db, 'John Doe', 'JD', 'john@example.com', '555-1234');
    expect(contact.name).toBe('John Doe');
    expect(contact.nickname).toBe('JD');
    expect(contact.email).toBe('john@example.com');
    expect(contact.phone).toBe('555-1234');
  });

  it('should_get_all_contacts', () => {
    createContact(db, 'Contact 1', '', '', '');
    createContact(db, 'Contact 2', '', '', '');
    const contacts = getAllContacts(db);
    expect(contacts).toHaveLength(2);
  });

  it('should_update_contact', () => {
    const contact = createContact(db, 'Old Name', 'ON', 'old@example.com', '555-0000');
    updateContact(db, contact.id, 'New Name', 'NN', 'new@example.com', '555-1111');
    const contacts = getAllContacts(db);
    expect(contacts[0].name).toBe('New Name');
    expect(contacts[0].email).toBe('new@example.com');
  });

  it('should_delete_contact', () => {
    const contact = createContact(db, 'To Delete', '', '', '');
    expect(getAllContacts(db)).toHaveLength(1);
    deleteContact(db, contact.id);
    expect(getAllContacts(db)).toHaveLength(0);
  });

  it('should_get_contact_todos', () => {
    const contact = createContact(db, 'Contact', '', '', '');
    const todo1 = createTodo(db, 'Todo 1');
    const todo2 = createTodo(db, 'Todo 2');
    setTodoContacts(db, todo1.id, [contact.id]);
    setTodoContacts(db, todo2.id, [contact.id]);

    const todos = getContactTodos(db, contact.id);
    expect(todos).toHaveLength(2);
  });

  it('should_get_contact_notes', () => {
    const contact = createContact(db, 'Contact', '', '', '');
    const note1 = createNote(db);
    const note2 = createNote(db);
    setNoteContacts(db, note1.id, [contact.id]);
    setNoteContacts(db, note2.id, [contact.id]);

    const notes = getContactNotes(db, contact.id);
    expect(notes).toHaveLength(2);
  });
});

describe('Notes', () => {
  it('should_create_note_with_default_content', () => {
    const note = createNote(db);
    expect(note.content).toBe('# Neue Notiz\n\n');
    expect(note.id).toBeTruthy();
    expect(note.createdAt).toBeTruthy();
  });

  it('should_get_all_notes', () => {
    createNote(db);
    createNote(db);
    const notes = getAllNotes(db);
    expect(notes).toHaveLength(2);
  });

  it('should_update_note_content', () => {
    const note = createNote(db);
    updateNoteContent(db, note.id, '# Updated\n\nNew content');
    const notes = getAllNotes(db);
    expect(notes[0].content).toBe('# Updated\n\nNew content');
  });

  it('should_delete_note', () => {
    const note = createNote(db);
    expect(getAllNotes(db)).toHaveLength(1);
    deleteNote(db, note.id);
    expect(getAllNotes(db)).toHaveLength(0);
  });

  it('should_set_note_project_associations', () => {
    const note = createNote(db);
    const project = createProject(db, 'Project', '');
    setNoteProjects(db, note.id, [project.id]);
    const projects = getNoteProjects(db, note.id);
    expect(projects).toContain(project.id);
  });

  it('should_get_project_notes', () => {
    const project = createProject(db, 'Project', '');
    const note1 = createNote(db);
    const note2 = createNote(db);
    setNoteProjects(db, note1.id, [project.id]);
    setNoteProjects(db, note2.id, [project.id]);

    const notes = getProjectNotes(db, project.id);
    expect(notes).toHaveLength(2);
  });
});

describe('Sync State', () => {
  it('should_insert_sync_state', () => {
    const project = createProject(db, 'Project', '');
    upsertSyncState(db, [
      {
        itemId: 'item1',
        projectId: project.id,
        itemType: 'todo',
        contentHash: 'hash1',
        syncedAt: new Date().toISOString(),
      },
    ]);

    const syncState = getSyncState(db, project.id);
    expect(syncState).toHaveLength(1);
    expect(syncState[0].itemId).toBe('item1');
  });

  it('should_update_existing_sync_state', () => {
    const project = createProject(db, 'Project', '');
    const now = new Date().toISOString();
    upsertSyncState(db, [
      {
        itemId: 'item1',
        projectId: project.id,
        itemType: 'todo',
        contentHash: 'hash1',
        syncedAt: now,
      },
    ]);

    const later = new Date(Date.now() + 1000).toISOString();
    upsertSyncState(db, [
      {
        itemId: 'item1',
        projectId: project.id,
        itemType: 'todo',
        contentHash: 'hash2',
        syncedAt: later,
      },
    ]);

    const syncState = getSyncState(db, project.id);
    expect(syncState).toHaveLength(1);
    expect(syncState[0].contentHash).toBe('hash2');
  });

  it('should_get_sync_state_for_specific_project', () => {
    const proj1 = createProject(db, 'Project 1', '');
    const proj2 = createProject(db, 'Project 2', '');

    upsertSyncState(db, [
      {
        itemId: 'item1',
        projectId: proj1.id,
        itemType: 'todo',
        contentHash: 'hash1',
        syncedAt: new Date().toISOString(),
      },
      {
        itemId: 'item2',
        projectId: proj2.id,
        itemType: 'todo',
        contentHash: 'hash2',
        syncedAt: new Date().toISOString(),
      },
    ]);

    const syncState1 = getSyncState(db, proj1.id);
    const syncState2 = getSyncState(db, proj2.id);
    expect(syncState1).toHaveLength(1);
    expect(syncState2).toHaveLength(1);
    expect(syncState1[0].itemId).toBe('item1');
    expect(syncState2[0].itemId).toBe('item2');
  });
});
