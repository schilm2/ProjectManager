import initSqlJs, { Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { Todo, Note, Project, Contact, ProjectStats } from '../types';
import { v4 as uuid } from 'uuid';

const DB_KEY = 'project_manager_db';
const DONE_VISIBILITY_DAYS = 3;

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export type PersistError = { type: 'quota' | 'encoding' | 'unknown'; message: string };
let onPersistError: ((error: PersistError) => void) | null = null;

export function setOnPersistError(handler: (error: PersistError) => void): void {
  onPersistError = handler;
}

export function getDB(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
}

async function initDB(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl,
  });

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    try {
      const buf = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
      db = new SQL.Database(buf);
    } catch {
      console.error('[DB] Corrupt database in localStorage, starting fresh');
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'open',
      done_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS todo_projects (
      todo_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      PRIMARY KEY (todo_id, project_id)
    );
    CREATE TABLE IF NOT EXISTS todo_contacts (
      todo_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      PRIMARY KEY (todo_id, contact_id)
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS note_projects (
      note_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      PRIMARY KEY (note_id, project_id)
    );
    CREATE TABLE IF NOT EXISTS note_contacts (
      note_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      PRIMARY KEY (note_id, contact_id)
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nickname TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  persist();
  return db;
}

export function persist(): void {
  if (!db) return;
  try {
    const data = db.export();
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    localStorage.setItem(DB_KEY, btoa(binary));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const type = message.includes('QuotaExceeded') ? 'quota' as const
      : message.includes('RangeError') ? 'encoding' as const
      : 'unknown' as const;
    console.error('[DB] persist failed:', message);
    if (onPersistError) {
      onPersistError({ type, message });
    }
  }
}

// --- Todos ---

export function getAllTodos(database: Database): Todo[] {
  const threeDaysAgo = new Date(Date.now() - DONE_VISIBILITY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const results = database.exec(
    `SELECT id, name, priority, status, done_at, created_at FROM todos
     WHERE NOT (status = 'done' AND done_at < ?)
     ORDER BY created_at DESC`,
    [threeDaysAgo]
  );
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
    priority: row[2] as Todo['priority'],
    status: row[3] as Todo['status'],
    doneAt: row[4] as string | null,
    createdAt: row[5] as string,
  }));
}

export function createTodo(database: Database, name: string, priority: Todo['priority'] = 'normal'): Todo {
  const id = uuid();
  const createdAt = new Date().toISOString();
  database.run(
    'INSERT INTO todos (id, name, priority, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, name, priority, 'open', createdAt]
  );
  persist();
  return { id, name, priority, status: 'open', doneAt: null, createdAt };
}

export function updateTodoStatus(database: Database, id: string, status: Todo['status']): void {
  const doneAt = status === 'done' ? new Date().toISOString() : null;
  database.run('UPDATE todos SET status = ?, done_at = ? WHERE id = ?', [status, doneAt, id]);
  persist();
}

export function updateTodo(database: Database, id: string, name: string, priority: Todo['priority']): void {
  database.run('UPDATE todos SET name = ?, priority = ? WHERE id = ?', [name, priority, id]);
  persist();
}

export function deleteTodo(database: Database, id: string): void {
  database.run('DELETE FROM todos WHERE id = ?', [id]);
  database.run('DELETE FROM todo_projects WHERE todo_id = ?', [id]);
  database.run('DELETE FROM todo_contacts WHERE todo_id = ?', [id]);
  persist();
}

export function setTodoProjects(database: Database, todoId: string, projectIds: string[]): void {
  database.run('DELETE FROM todo_projects WHERE todo_id = ?', [todoId]);
  for (const pid of projectIds) {
    database.run('INSERT INTO todo_projects (todo_id, project_id) VALUES (?, ?)', [todoId, pid]);
  }
  persist();
}

export function setTodoContacts(database: Database, todoId: string, contactIds: string[]): void {
  database.run('DELETE FROM todo_contacts WHERE todo_id = ?', [todoId]);
  for (const cid of contactIds) {
    database.run('INSERT INTO todo_contacts (todo_id, contact_id) VALUES (?, ?)', [todoId, cid]);
  }
  persist();
}

export function getTodoProjects(database: Database, todoId: string): string[] {
  const results = database.exec('SELECT project_id FROM todo_projects WHERE todo_id = ?', [todoId]);
  if (!results.length) return [];
  return results[0].values.map((r) => r[0] as string);
}

export function getTodoContacts(database: Database, todoId: string): string[] {
  const results = database.exec('SELECT contact_id FROM todo_contacts WHERE todo_id = ?', [todoId]);
  if (!results.length) return [];
  return results[0].values.map((r) => r[0] as string);
}

// --- Notes ---

export function getAllNotes(database: Database): Note[] {
  const results = database.exec('SELECT id, content, created_at FROM notes ORDER BY created_at DESC');
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    content: row[1] as string,
    createdAt: row[2] as string,
  }));
}

export function createNote(database: Database): Note {
  const id = uuid();
  const createdAt = new Date().toISOString();
  database.run('INSERT INTO notes (id, content, created_at) VALUES (?, ?, ?)', [id, '# Neue Notiz\n\n', createdAt]);
  persist();
  return { id, content: '# Neue Notiz\n\n', createdAt };
}

export function updateNoteContent(database: Database, id: string, content: string): void {
  database.run('UPDATE notes SET content = ? WHERE id = ?', [content, id]);
  persist();
}

export function deleteNote(database: Database, id: string): void {
  database.run('DELETE FROM notes WHERE id = ?', [id]);
  database.run('DELETE FROM note_projects WHERE note_id = ?', [id]);
  database.run('DELETE FROM note_contacts WHERE note_id = ?', [id]);
  persist();
}

export function setNoteProjects(database: Database, noteId: string, projectIds: string[]): void {
  database.run('DELETE FROM note_projects WHERE note_id = ?', [noteId]);
  for (const pid of projectIds) {
    database.run('INSERT INTO note_projects (note_id, project_id) VALUES (?, ?)', [noteId, pid]);
  }
  persist();
}

export function setNoteContacts(database: Database, noteId: string, contactIds: string[]): void {
  database.run('DELETE FROM note_contacts WHERE note_id = ?', [noteId]);
  for (const cid of contactIds) {
    database.run('INSERT INTO note_contacts (note_id, contact_id) VALUES (?, ?)', [noteId, cid]);
  }
  persist();
}

export function getNoteProjects(database: Database, noteId: string): string[] {
  const results = database.exec('SELECT project_id FROM note_projects WHERE note_id = ?', [noteId]);
  if (!results.length) return [];
  return results[0].values.map((r) => r[0] as string);
}

export function getNoteContacts(database: Database, noteId: string): string[] {
  const results = database.exec('SELECT contact_id FROM note_contacts WHERE note_id = ?', [noteId]);
  if (!results.length) return [];
  return results[0].values.map((r) => r[0] as string);
}

// --- Projects ---

export function getAllProjects(database: Database): Project[] {
  const results = database.exec('SELECT id, name, description, created_at FROM projects ORDER BY name');
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
    description: row[2] as string,
    createdAt: row[3] as string,
  }));
}

export function createProject(database: Database, name: string, description: string): Project {
  const id = uuid();
  const createdAt = new Date().toISOString();
  database.run('INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)', [id, name, description, createdAt]);
  persist();
  return { id, name, description, createdAt };
}

export function updateProject(database: Database, id: string, name: string, description: string): void {
  database.run('UPDATE projects SET name = ?, description = ? WHERE id = ?', [name, description, id]);
  persist();
}

export function deleteProject(database: Database, id: string): void {
  database.run('DELETE FROM projects WHERE id = ?', [id]);
  database.run('DELETE FROM todo_projects WHERE project_id = ?', [id]);
  database.run('DELETE FROM note_projects WHERE project_id = ?', [id]);
  persist();
}

export function getProjectStats(database: Database, projectId: string): ProjectStats {
  const results = database.exec(
    `SELECT t.status, COUNT(*) FROM todos t
     JOIN todo_projects tp ON tp.todo_id = t.id
     WHERE tp.project_id = ?
     GROUP BY t.status`,
    [projectId]
  );
  const stats: ProjectStats = { total: 0, open: 0, inProgress: 0, done: 0 };
  if (!results.length) return stats;
  for (const row of results[0].values) {
    const count = row[1] as number;
    stats.total += count;
    if (row[0] === 'open') stats.open = count;
    else if (row[0] === 'in_progress') stats.inProgress = count;
    else if (row[0] === 'done') stats.done = count;
  }
  return stats;
}

export function getProjectTodos(database: Database, projectId: string): Todo[] {
  const results = database.exec(
    `SELECT t.id, t.name, t.priority, t.status, t.done_at, t.created_at
     FROM todos t JOIN todo_projects tp ON tp.todo_id = t.id
     WHERE tp.project_id = ? ORDER BY t.created_at DESC`,
    [projectId]
  );
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
    priority: row[2] as Todo['priority'],
    status: row[3] as Todo['status'],
    doneAt: row[4] as string | null,
    createdAt: row[5] as string,
  }));
}

export function getProjectNotes(database: Database, projectId: string): Note[] {
  const results = database.exec(
    `SELECT n.id, n.content, n.created_at
     FROM notes n JOIN note_projects np ON np.note_id = n.id
     WHERE np.project_id = ? ORDER BY n.created_at DESC`,
    [projectId]
  );
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    content: row[1] as string,
    createdAt: row[2] as string,
  }));
}

// --- Contacts ---

export function getAllContacts(database: Database): Contact[] {
  const results = database.exec('SELECT id, name, nickname, email, phone, created_at FROM contacts ORDER BY name');
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
    nickname: row[2] as string,
    email: row[3] as string,
    phone: row[4] as string,
    createdAt: row[5] as string,
  }));
}

export function createContact(database: Database, name: string, nickname: string, email: string, phone: string): Contact {
  const id = uuid();
  const createdAt = new Date().toISOString();
  database.run('INSERT INTO contacts (id, name, nickname, email, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, name, nickname, email, phone, createdAt]);
  persist();
  return { id, name, nickname, email, phone, createdAt };
}

export function updateContact(database: Database, id: string, name: string, nickname: string, email: string, phone: string): void {
  database.run('UPDATE contacts SET name = ?, nickname = ?, email = ?, phone = ? WHERE id = ?', [name, nickname, email, phone, id]);
  persist();
}

export function deleteContact(database: Database, id: string): void {
  database.run('DELETE FROM contacts WHERE id = ?', [id]);
  database.run('DELETE FROM todo_contacts WHERE contact_id = ?', [id]);
  database.run('DELETE FROM note_contacts WHERE contact_id = ?', [id]);
  persist();
}

export function getContactTodos(database: Database, contactId: string): Todo[] {
  const results = database.exec(
    `SELECT t.id, t.name, t.priority, t.status, t.done_at, t.created_at
     FROM todos t JOIN todo_contacts tc ON tc.todo_id = t.id
     WHERE tc.contact_id = ? ORDER BY t.created_at DESC`,
    [contactId]
  );
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    name: row[1] as string,
    priority: row[2] as Todo['priority'],
    status: row[3] as Todo['status'],
    doneAt: row[4] as string | null,
    createdAt: row[5] as string,
  }));
}

export function getContactNotes(database: Database, contactId: string): Note[] {
  const results = database.exec(
    `SELECT n.id, n.content, n.created_at
     FROM notes n JOIN note_contacts nc ON nc.note_id = n.id
     WHERE nc.contact_id = ? ORDER BY n.created_at DESC`,
    [contactId]
  );
  if (!results.length) return [];
  return results[0].values.map((row) => ({
    id: row[0] as string,
    content: row[1] as string,
    createdAt: row[2] as string,
  }));
}
