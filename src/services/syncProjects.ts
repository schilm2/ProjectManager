import { Database } from 'sql.js';
import {
  getAllProjects,
  getProjectTodos,
  getProjectNotes,
  getSyncState,
  upsertSyncState,
  updateProject,
  getAllContacts,
  getTodoContacts,
  getNoteContacts,
  SyncStateEntry,
} from '../db/database';
import { Project, Todo, Note, Contact } from '../types';
import { STORAGE_KEYS } from '../constants/storage';

export interface SyncProgress {
  current: number;
  total: number;
  projectName: string;
  status: 'syncing' | 'done' | 'error' | 'skipped';
  error?: string;
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getTodoContent(todo: Todo): string {
  return `${todo.name}|${todo.priority}|${todo.status}`;
}

interface UnsyncedItem {
  id: string;
  type: 'todo' | 'note';
  content: string;
  contactNames: string[];
}

async function findUnsyncedItems(
  database: Database,
  projectId: string,
  todos: Todo[],
  notes: Note[],
  contacts: Contact[]
): Promise<{ items: UnsyncedItem[]; allHashes: Map<string, string> }> {
  const syncState = getSyncState(database, projectId);
  const syncMap = new Map(syncState.map(s => [s.itemId, s.contentHash]));
  const contactMap = new Map(contacts.map(c => [c.id, c.name]));

  const items: UnsyncedItem[] = [];
  const allHashes = new Map<string, string>();

  for (const todo of todos) {
    const content = getTodoContent(todo);
    const hash = await hashContent(content);
    allHashes.set(todo.id, hash);

    const previousHash = syncMap.get(todo.id);
    if (previousHash !== hash) {
      const todoContactIds = getTodoContacts(database, todo.id);
      const contactNames = todoContactIds
        .map(id => contactMap.get(id))
        .filter((n): n is string => !!n);

      items.push({
        id: todo.id,
        type: 'todo',
        content: `[${todo.status}] [${todo.priority}] ${todo.name}`,
        contactNames,
      });
    }
  }

  for (const note of notes) {
    const hash = await hashContent(note.content);
    allHashes.set(note.id, hash);

    const previousHash = syncMap.get(note.id);
    if (previousHash !== hash) {
      const noteContactIds = getNoteContacts(database, note.id);
      const contactNames = noteContactIds
        .map(id => contactMap.get(id))
        .filter((n): n is string => !!n);

      items.push({
        id: note.id,
        type: 'note',
        content: note.content,
        contactNames,
      });
    }
  }

  return { items, allHashes };
}

function buildPrompt(
  project: Project,
  unsyncedItems: UnsyncedItem[]
): string {
  const todoItems = unsyncedItems.filter(i => i.type === 'todo');
  const noteItems = unsyncedItems.filter(i => i.type === 'note');

  let itemsText = '';

  if (todoItems.length > 0) {
    itemsText += '## Neue/geänderte ToDos:\n';
    for (const item of todoItems) {
      itemsText += `- ${item.content}`;
      if (item.contactNames.length > 0) {
        itemsText += ` (Beteiligte: ${item.contactNames.join(', ')})`;
      }
      itemsText += '\n';
    }
  }

  if (noteItems.length > 0) {
    itemsText += '\n## Neue/geänderte Notizen:\n';
    for (const item of noteItems) {
      itemsText += `---\n${item.content}\n`;
      if (item.contactNames.length > 0) {
        itemsText += `(Beteiligte: ${item.contactNames.join(', ')})\n`;
      }
    }
  }

  const allContactNames = [
    ...new Set(unsyncedItems.flatMap(i => i.contactNames))
  ];

  return `Du bist ein Projektmanagement-Assistent. Deine Aufgabe ist es, eine bestehende Projektbeschreibung mit neuen Informationen aus ToDos und Notizen zu aktualisieren.

## Regeln:
1. Integriere die neuen Informationen sinnvoll in die bestehende Beschreibung — füge sie nicht einfach ans Ende an.
2. ToDos und Notizen ohne wirklichen Mehrwert für die Projektbeschreibung darfst du ignorieren (z.B. reine Status-Updates ohne Inhalt).
3. Halte den Schreibstil der bestehenden Beschreibung bei.
4. Personen/Kontakte die in den neuen Items erwähnt werden, sollen unter der Überschrift "## Beteiligte Personen" aufgelistet werden. Falls diese Sektion bereits existiert, ergänze sie.
5. Wenn es Widersprüche zwischen den neuen Informationen gibt, liste diese am Ende unter "## Klärungsbedarf" auf.
6. Antworte NUR mit der aktualisierten Projektbeschreibung. Kein einleitender Text, keine Erklärungen.
7. Falls die bestehende Beschreibung leer ist, erstelle eine neue basierend auf den Informationen.
8. Schreibe in derselben Sprache wie die bestehende Beschreibung (Standard: Deutsch).

## Projektname: ${project.name}

## Bestehende Beschreibung:
${project.description || '(leer)'}

${itemsText}

${allContactNames.length > 0 ? `## Erwähnte Personen: ${allContactNames.join(', ')}` : ''}

Gib jetzt die aktualisierte Projektbeschreibung aus:`;
}

async function callLLM(prompt: string): Promise<string> {
  const baseUrl = (localStorage.getItem(STORAGE_KEYS.LM_STUDIO_URL) || 'http://localhost:1234').replace(/\/+$/, '');
  const model = localStorage.getItem(STORAGE_KEYS.LM_STUDIO_MODEL) || '';

  if (!model) {
    throw new Error('Kein LLM-Modell konfiguriert. Bitte zuerst in den Einstellungen ein Modell auswählen.');
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM-Anfrage fehlgeschlagen: HTTP ${response.status}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Keine Antwort vom LLM erhalten.');
  }

  return content.trim();
}

export async function syncProjects(
  database: Database,
  onProgress: (progress: SyncProgress) => void
): Promise<void> {
  const projects = getAllProjects(database).filter(p => p.status === 'active');
  const contacts = getAllContacts(database);
  const total = projects.length;

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];

    onProgress({ current: i + 1, total, projectName: project.name, status: 'syncing' });

    try {
      const todos = getProjectTodos(database, project.id);
      const notes = getProjectNotes(database, project.id);
      const { items, allHashes } = await findUnsyncedItems(database, project.id, todos, notes, contacts);

      if (items.length === 0) {
        onProgress({ current: i + 1, total, projectName: project.name, status: 'skipped' });

        const syncEntries: SyncStateEntry[] = [];
        for (const [itemId, hash] of allHashes) {
          const itemType = todos.some(t => t.id === itemId) ? 'todo' as const : 'note' as const;
          syncEntries.push({
            itemId,
            projectId: project.id,
            itemType,
            contentHash: hash,
            syncedAt: new Date().toISOString(),
          });
        }
        if (syncEntries.length > 0) {
          upsertSyncState(database, syncEntries);
        }
        continue;
      }

      const prompt = buildPrompt(project, items);
      const updatedDescription = await callLLM(prompt);

      updateProject(database, project.id, project.name, updatedDescription);

      const syncEntries: SyncStateEntry[] = [];
      for (const [itemId, hash] of allHashes) {
        const itemType = todos.some(t => t.id === itemId) ? 'todo' as const : 'note' as const;
        syncEntries.push({
          itemId,
          projectId: project.id,
          itemType,
          contentHash: hash,
          syncedAt: new Date().toISOString(),
        });
      }
      upsertSyncState(database, syncEntries);

      onProgress({ current: i + 1, total, projectName: project.name, status: 'done' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      onProgress({ current: i + 1, total, projectName: project.name, status: 'error', error: message });
    }
  }
}
