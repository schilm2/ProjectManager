import { useState } from 'react';
import { Database } from 'sql.js';
import { Note } from '../../types';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';

interface NotesPageProps {
  db: Database;
}

export function NotesPage({ db }: NotesPageProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleDelete(id: string) {
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  }

  function handleSave() {
    setRefreshKey((k) => k + 1);
  }

  return (
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
  );
}
