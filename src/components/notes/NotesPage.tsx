import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Database } from 'sql.js';
import { Note } from '../../types';
import { createNote, getAllNotes } from '../../db/database';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';

interface NotesPageProps {
  db: Database;
}

export function NotesPage({ db }: NotesPageProps) {
  const location = useLocation();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const didAutoCreate = useRef(false);

  useEffect(() => {
    const state = location.state as { autoCreate?: boolean; selectedNoteId?: string } | null;
    if (state?.autoCreate && !didAutoCreate.current) {
      didAutoCreate.current = true;
      const note = createNote(db);
      setRefreshKey((k) => k + 1);
      setSelectedNote(note);
    } else if (state?.selectedNoteId && !didAutoCreate.current) {
      didAutoCreate.current = true;
      const allNotes = getAllNotes(db);
      const target = allNotes.find((n) => n.id === state.selectedNoteId) ?? null;
      if (target) {
        setSelectedNote(target);
      }
    }
  }, [db, location.state]);

  function handleDelete(id: string) {
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  }

  function handleSave() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Notizen<span className="header-accent">Gedanken festhalten</span></h2>
      </div>
      <div className="notes-page">
        <NotesList db={db} onSelect={setSelectedNote} onDelete={handleDelete} selectedId={selectedNote?.id ?? null} refreshKey={refreshKey} />
        <div className="notes-detail">
          {selectedNote ? (
            <NoteEditor db={db} note={selectedNote} onSave={handleSave} />
          ) : (
            <div className="empty-state-centered">
              <p>Wähle eine Notiz aus oder erstelle eine neue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
