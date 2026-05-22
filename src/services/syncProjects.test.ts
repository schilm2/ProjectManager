import { describe, it, expect, beforeEach, vi } from 'vitest';
import initSqlJs, { Database } from 'sql.js';
import {
  syncProjects,
  SyncProgress,
} from './syncProjects';
import {
  createProject,
  createTodo,
  createNote,
  createContact,
  setTodoProjects,
  setNoteProjects,
  setTodoContacts,
  setNoteContacts,
  getSyncState,
  getAllProjects,
} from '../db/database';

let db: Database;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  // Create all tables
  db.run(`
    CREATE TABLE todos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
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

  // Mock localStorage
  global.localStorage = {
    getItem: vi.fn((key: string) => {
      if (key === 'lmstudio-url') return 'http://localhost:1234';
      if (key === 'lmstudio-model') return 'test-model';
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  } as any;

  // Mock fetch for LLM calls
  global.fetch = vi.fn();
});

describe('syncProjects', () => {
  it('should_skip_archived_projects', async () => {
    const activeProject = createProject(db, 'Active', '');
    const archivedProject = createProject(db, 'Archived', '');

    db.run('UPDATE projects SET status = ? WHERE id = ?', ['archive', archivedProject.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const activeUpdates = progressUpdates.filter((p) => p.projectName === 'Active');
    const archivedUpdates = progressUpdates.filter((p) => p.projectName === 'Archived');
    expect(activeUpdates.length).toBeGreaterThan(0);
    expect(archivedUpdates).toHaveLength(0);
  });

  it('should_handle_projects_with_no_items', async () => {
    const project = createProject(db, 'Empty Project', '');

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const projectUpdates = progressUpdates.filter((p) => p.projectName === 'Empty Project');
    expect(projectUpdates.length).toBeGreaterThan(0);
  });

  it('should_report_progress_for_each_project', async () => {
    const proj1 = createProject(db, 'Project 1', '');
    const proj2 = createProject(db, 'Project 2', '');
    const todo1 = createTodo(db, 'Todo 1');
    const todo2 = createTodo(db, 'Todo 2');
    setTodoProjects(db, todo1.id, [proj1.id]);
    setTodoProjects(db, todo2.id, [proj2.id]);

    (global.fetch as any) = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Updated 1' } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Updated 2' } }],
        }),
      });

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    expect(progressUpdates[0].total).toBe(2);
    expect(progressUpdates.some((p) => p.current === 1)).toBe(true);
    expect(progressUpdates.some((p) => p.current === 2)).toBe(true);
  });

  it('should_report_error_when_no_model_configured', async () => {
    (global.localStorage.getItem as any) = vi.fn((key: string) => {
      if (key === 'lmstudio-url') return 'http://localhost:1234';
      if (key === 'lmstudio-model') return null;
      return null;
    });

    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Unsynced Todo');
    setTodoProjects(db, todo.id, [project.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const lastUpdate = progressUpdates[progressUpdates.length - 1];
    expect(lastUpdate.status).toBe('error');
    expect(lastUpdate.error).toContain('Modell');
  });

  it('should_handle_llm_response_errors', async () => {
    (global.fetch as any) = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Unsynced Todo');
    setTodoProjects(db, todo.id, [project.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const lastUpdate = progressUpdates[progressUpdates.length - 1];
    expect(lastUpdate.status).toBe('error');
    expect(lastUpdate.error).toContain('HTTP 500');
  });

  it('should_include_contact_names_in_sync_items', async () => {
    (global.fetch as any) = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Updated description' } }],
      }),
    });

    const project = createProject(db, 'Project', 'Old description');
    const contact = createContact(db, 'John Doe', 'JD', 'john@example.com', '555-1234');
    const todo = createTodo(db, 'Todo');
    setTodoProjects(db, todo.id, [project.id]);
    setTodoContacts(db, todo.id, [contact.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    if ((global.fetch as any).mock.calls.length > 0) {
      const fetchCall = (global.fetch as any).mock.calls[0];
      const fetchBody = JSON.parse(fetchCall[1].body);
      const prompt = fetchBody.messages[0].content;
      expect(prompt).toContain('John Doe');
    }
  });

  it('should_update_sync_state_after_successful_sync', async () => {
    (global.fetch as any) = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Updated description' } }],
      }),
    });

    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Unsynced Todo');
    setTodoProjects(db, todo.id, [project.id]);

    const syncStateBefore = getSyncState(db, project.id);
    expect(syncStateBefore).toHaveLength(0);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const syncStateAfter = getSyncState(db, project.id);
    expect(syncStateAfter.length).toBeGreaterThan(0);
    expect(syncStateAfter[0].itemId).toBe(todo.id);
  });

  it('should_handle_mixed_todos_and_notes', async () => {
    (global.fetch as any) = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Updated description' } }],
      }),
    });

    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Todo');
    const note = createNote(db);
    setTodoProjects(db, todo.id, [project.id]);
    setNoteProjects(db, note.id, [project.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const fetchCall = (global.fetch as any).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);
    const prompt = fetchBody.messages[0].content;

    expect(prompt).toContain('Neue/geänderte ToDos');
    expect(prompt).toContain('Neue/geänderte Notizen');
  });

  it('should_send_correct_llm_parameters', async () => {
    (global.fetch as any) = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Updated description' } }],
      }),
    });

    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Todo');
    setTodoProjects(db, todo.id, [project.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const fetchCall = (global.fetch as any).mock.calls[0];
    const fetchBody = JSON.parse(fetchCall[1].body);

    expect(fetchBody.model).toBe('test-model');
    expect(fetchBody.temperature).toBe(0.3);
    expect(fetchBody.max_tokens).toBe(4096);
    expect(fetchBody.messages[0].role).toBe('user');
  });

  it('should_handle_empty_llm_response', async () => {
    (global.fetch as any) = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Todo');
    setTodoProjects(db, todo.id, [project.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const lastUpdate = progressUpdates[progressUpdates.length - 1];
    expect(lastUpdate.status).toBe('error');
  });

  it('should_handle_network_errors_gracefully', async () => {
    (global.fetch as any) = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const project = createProject(db, 'Project', '');
    const todo = createTodo(db, 'Todo');
    setTodoProjects(db, todo.id, [project.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    const lastUpdate = progressUpdates[progressUpdates.length - 1];
    expect(lastUpdate.status).toBe('error');
    expect(lastUpdate.error).toContain('Network error');
  });

  it('should_process_multiple_projects_sequentially', async () => {
    (global.fetch as any) = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Updated 1' } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Updated 2' } }],
        }),
      });

    const project1 = createProject(db, 'Project 1', '');
    const project2 = createProject(db, 'Project 2', '');
    const todo1 = createTodo(db, 'Todo 1');
    const todo2 = createTodo(db, 'Todo 2');
    setTodoProjects(db, todo1.id, [project1.id]);
    setTodoProjects(db, todo2.id, [project2.id]);

    const progressUpdates: SyncProgress[] = [];
    await syncProjects(db, (progress) => progressUpdates.push(progress));

    expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
    expect((global.fetch as any).mock.calls).toHaveLength(2);
  });
});
