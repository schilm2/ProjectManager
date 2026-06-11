import { useState, useEffect, useCallback, useMemo } from 'react';
import { Database } from 'sql.js';
import { Note, Project, Contact } from '../../types';
import { updateNoteContent, getNoteProjects, getNoteContacts, setNoteProjects, setNoteContacts, getAllProjects, getAllContacts, createProject, createTodo, setTodoProjects, todoExistsByName } from '../../db/database';
import { MultiSelect } from '../common/MultiSelect';
import { RichTextarea } from '../ui/RichTextarea';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface NoteEditorProps {
  db: Database;
  note: Note;
  onSave?: () => void;
}

export function NoteEditor({ db, note, onSave }: NoteEditorProps) {
  const [content, setContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => getNoteProjects(db, note.id));
  const [selectedContacts, setSelectedContacts] = useState<string[]>(() => getNoteContacts(db, note.id));

  const baseProjects: Project[] = useMemo(() => getAllProjects(db), [db]);
  const [extraProjects, setExtraProjects] = useState<Project[]>([]);
  const projects = useMemo(() => [...baseProjects, ...extraProjects], [baseProjects, extraProjects]);
  const contacts: Contact[] = useMemo(() => getAllContacts(db), [db]);

  useEffect(() => {
    setContent(note.content);
    setSelectedProjects(getNoteProjects(db, note.id));
    setSelectedContacts(getNoteContacts(db, note.id));
    setExtraProjects([]);
    setIsEditing(false);
  }, [note.id, db]);

  const save = useCallback(() => {
    try {
      updateNoteContent(db, note.id, content);
      const projectIds = getNoteProjects(db, note.id);
      for (const line of content.split('\n')) {
        const match = line.match(/^(.+)\s*-->\s*TODO\s*$/);
        if (match) {
          const title = match[1].trim().replace(/^-\s*/, '');
          if (!todoExistsByName(db, title)) {
            const todo = createTodo(db, title);
            if (projectIds.length > 0) {
              setTodoProjects(db, todo.id, projectIds);
            }
          }
        }
      }
      setIsEditing(false);
      onSave?.();
    } catch (err) {
      console.error('[NoteEditor] Save failed:', err);
    }
  }, [db, note.id, content, onSave]);

  function handleCreateProject(name: string) {
    const created = createProject(db, name, '');
    setExtraProjects((prev) => [...prev, created]);
    setSelectedProjects((prev) => [...prev, created.id]);
    try {
      setNoteProjects(db, note.id, [...selectedProjects, created.id]);
    } catch (err) {
      console.error('[NoteEditor] Failed to link new project:', err);
    }
  }

  function handleProjectsChange(ids: string[]) {
    setSelectedProjects(ids);
    try {
      setNoteProjects(db, note.id, ids);
    } catch (err) {
      console.error('[NoteEditor] Failed to update projects:', err);
    }
  }

  function handleContactsChange(ids: string[]) {
    setSelectedContacts(ids);
    try {
      setNoteContacts(db, note.id, ids);
    } catch (err) {
      console.error('[NoteEditor] Failed to update contacts:', err);
    }
  }

  return (
    <div className="note-editor">
      <div className="note-editor-meta">
        <div className="meta-row">
          <span className="meta-label">Datum:</span>
          <span>{new Date(note.createdAt).toLocaleDateString('de-DE')}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Projekte:</span>
          <MultiSelect
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            selected={selectedProjects}
            onChange={handleProjectsChange}
            placeholder="Projekte..."
            onCreateOption={handleCreateProject}
            createOptionLabel="+ Neues Projekt"
          />
        </div>
        <div className="meta-row">
          <span className="meta-label">Personen:</span>
          <MultiSelect
            options={contacts.map((c) => ({ value: c.id, label: c.name }))}
            selected={selectedContacts}
            onChange={handleContactsChange}
            placeholder="Personen..."
          />
        </div>
      </div>
      <div className="note-editor-content">
        {isEditing ? (
          <div className="note-edit-area">
            <RichTextarea
              value={content}
              onChange={setContent}
              autoFocus
            />
            <div className="note-edit-actions">
              <button className="btn btn-primary" onClick={save}>Speichern</button>
              <button className="btn" onClick={() => { setContent(note.content); setIsEditing(false); }}>Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="note-rendered" onClick={() => setIsEditing(true)} title="Klicken zum Bearbeiten">
            <MarkdownRenderer>{content}</MarkdownRenderer>
          </div>
        )}
      </div>
    </div>
  );
}
