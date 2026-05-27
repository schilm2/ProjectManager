import { Database } from 'sql.js';
import { Note } from '../../types';
import { getAllNotes, createNote, deleteNote } from '../../db/database';
import { useState, useEffect } from 'react';
import { DeleteConfirmDialog } from '../ui/DeleteConfirmDialog';

interface NotesListProps {
  db: Database;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  refreshKey: number;
}

export function NotesList({ db, onSelect, onDelete, selectedId, refreshKey }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>(() => getAllNotes(db));
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    deleteNote(db, deletingId);
    setNotes(getAllNotes(db));
    onDelete(deletingId);
    setDeletingId(null);
  }

  function extractTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    return firstLine.replace(/^#+\s*/, '') || 'Unbenannt';
  }

  function extractPreview(content: string): string {
    const lines = content.split('\n').filter((l) => !l.startsWith('#') && l.trim().length > 0);
    return lines.slice(0, 2).join(' ').slice(0, 120) || '';
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="note-item-title">{extractTitle(note.content)}</span>
              {extractPreview(note.content) && (
                <div className="note-item-preview">{extractPreview(note.content)}</div>
              )}
            </div>
            <span className="note-item-date">{new Date(note.createdAt).toLocaleDateString('de-DE')}</span>
            <button className="btn-icon btn-danger" onClick={(e) => handleDelete(e, note.id)} aria-label="Löschen">&times;</button>
          </li>
        ))}
        {notes.length === 0 && <li className="empty-state">Noch keine Notizen</li>}
      </ul>
      {deletingId && (
        <DeleteConfirmDialog
          itemName={notes.find((n) => n.id === deletingId) ? extractTitle(notes.find((n) => n.id === deletingId)!.content) : 'Notiz'}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
