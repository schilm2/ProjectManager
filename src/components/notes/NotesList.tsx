import { Database } from 'sql.js';
import { Note } from '../../types';
import { getAllNotes, createNote, deleteNote } from '../../db/database';
import { useState, useEffect } from 'react';

interface NotesListProps {
  db: Database;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  refreshKey: number;
}

export function NotesList({ db, onSelect, onDelete, selectedId, refreshKey }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>(() => getAllNotes(db));

  useEffect(() => {
    setNotes(getAllNotes(db));
  }, [db, refreshKey]);

  function handleCreate() {
    const note = createNote(db);
    setNotes(getAllNotes(db));
    onSelect(note);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteNote(db, id);
    setNotes(getAllNotes(db));
    onDelete(id);
  }

  function extractTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    return firstLine.replace(/^#+\s*/, '') || 'Unbenannt';
  }

  return (
    <div className="notes-list">
      <div className="notes-list-header">
        <h3>Notizen</h3>
        <button className="btn btn-primary" onClick={handleCreate}>+ Neue Notiz</button>
      </div>
      <ul className="notes-items">
        {notes.map((note) => (
          <li
            key={note.id}
            className={`note-item ${selectedId === note.id ? 'active' : ''}`}
            onClick={() => onSelect(note)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(note); }}
          >
            <span className="note-item-title">{extractTitle(note.content)}</span>
            <span className="note-item-date">{new Date(note.createdAt).toLocaleDateString('de-DE')}</span>
            <button className="btn-icon btn-danger" onClick={(e) => handleDelete(e, note.id)} aria-label="Löschen">&times;</button>
          </li>
        ))}
        {notes.length === 0 && <li className="empty-state">Noch keine Notizen</li>}
      </ul>
    </div>
  );
}
