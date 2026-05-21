import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Database } from 'sql.js';
import { Note, Project, Contact } from '../../types';
import { updateNoteContent, getNoteProjects, getNoteContacts, setNoteProjects, setNoteContacts, getAllProjects, getAllContacts } from '../../db/database';
import { MultiSelect } from '../common/MultiSelect';

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

  const projects: Project[] = useMemo(() => getAllProjects(db), [db]);
  const contacts: Contact[] = useMemo(() => getAllContacts(db), [db]);

  useEffect(() => {
    setContent(note.content);
    setSelectedProjects(getNoteProjects(db, note.id));
    setSelectedContacts(getNoteContacts(db, note.id));
    setIsEditing(false);
  }, [note.id, db]);

  const save = useCallback(() => {
    try {
      updateNoteContent(db, note.id, content);
      setIsEditing(false);
      onSave?.();
    } catch (err) {
      console.error('[NoteEditor] Save failed:', err);
    }
  }, [db, note.id, content, onSave]);

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
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            <div className="note-edit-actions">
              <button className="btn btn-primary" onClick={save}>Speichern</button>
              <button className="btn" onClick={() => { setContent(note.content); setIsEditing(false); }}>Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="note-rendered" onClick={() => setIsEditing(true)} title="Klicken zum Bearbeiten">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
